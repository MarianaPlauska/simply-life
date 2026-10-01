import { useEffect, useMemo, useState } from 'react'
import { ScrollView, View } from 'react-native'
import {
  TASK_WAIT_CHANNELS,
  TASK_WAIT_REASONS,
  formatDuration,
  formatWaitAge,
  openWaitFor,
  recentWaitPeople,
  parsePlannedHelpers,
  removePlannedHelper,
  stampPlannedHelpers,
  taskTimeSplit,
  waitBadge,
  waitDays,
  waitHeadline,
  waitMs,
  waitNeedsNudge,
  waitsForTask,
  type MobileTask,
  type TaskWait,
  type TaskWaitChannel,
  type TaskWaitReason,
} from '@simply-life/shared'
import { Card, Chip, Field, Icon, PrimaryButton, Text } from '../../ui'
import { useTheme } from '../../theme/ThemeProvider'
import { useTaskWaitStore } from '../../store/taskWaitStore'
import { useFocusStore } from '../../store/focusStore'
import { useCircleStore } from '../../store/circleStore'
import { useDataStore } from '../../store/dataStore'
import { useAuthStore } from '../../store/authStore'
import { TaskPeopleEditor, helperLine } from './TaskPeopleEditor'

function channelLabel(c: TaskWaitChannel | null): string | null
{
  return c ? TASK_WAIT_CHANNELS.find((x) => x.id === c)?.label ?? null : null
}

function nudgeLine(w: TaskWait): string
{
  const n = w.cobrancas.length
  if (n === 0) return 'Ainda não cobrou'
  return n === 1 ? 'Cobrou 1 vez' : `Cobrou ${n} vezes`
}

/** Espera em andamento: quem, desde quando, cobrar e encerrar. */
export function TaskWaitOpenCard({ wait, task, compact }: { wait: TaskWait; task?: MobileTask; compact?: boolean })
{
  const { colors, space, radius } = useTheme()
  const nudge = useTaskWaitStore((s) => s.nudge)
  const finish = useTaskWaitStore((s) => s.finish)
  const days = waitDays(wait, task)
  const late = waitNeedsNudge(wait)
  const canal = channelLabel(wait.canal)

  return (
    <View
      style={{
        gap: space.md,
        padding: space.md,
        borderRadius: radius.control,
        backgroundColor: colors.attentionMuted,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <Icon name="people-outline" size={20} color={colors.attention} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{waitHeadline(wait)}</Text>
          <Text variant="caption" muted>
            {formatWaitAge(days)}
            {canal ? ` · ${canal}` : ''}
            {` · ${nudgeLine(wait)}`}
          </Text>
          {!compact && wait.nota ? (
            <Text variant="caption" muted>
              {wait.nota}
            </Text>
          ) : null}
          {late ? (
            <Text variant="caption" style={{ color: colors.attention, fontWeight: '600' }}>
              Já faz uns dias sem retorno. Vale uma mensagem.
            </Text>
          ) : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label="Cobrei agora"
            variant="secondary"
            size="sm"
            icon="send-outline"
            onPress={() => nudge(wait.id)}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            label={`${wait.pessoa.split(' ')[0]} concluiu`}
            size="sm"
            icon="checkmark"
            onPress={() => finish(wait.id)}
          />
        </View>
      </View>
    </View>
  )
}

/** Formulário curto para começar uma espera. */
export function TaskWaitForm({ taskId, onDone }: { taskId: string; onDone?: () => void })
{
  const { space } = useTheme()
  const waits = useTaskWaitStore((s) => s.waits)
  const start = useTaskWaitStore((s) => s.start)
  const friends = useCircleStore((s) => s.friends)
  const loadFriends = useCircleStore((s) => s.load)
  const [pessoa, setPessoa] = useState('')
  const [amigoId, setAmigoId] = useState<string | null>(null)
  // amigos do Círculo primeiro; depois nomes usados antes que não são amigos
  const people = useMemo(() =>
  {
    const names = new Set(friends.map((f) => f.displayName.trim().toLowerCase()))
    return recentWaitPeople(waits).filter((p) => !names.has(p.trim().toLowerCase()))
  }, [waits, friends])

  useEffect(() =>
  {
    void loadFriends()
  }, [loadFriends])
  const [motivo, setMotivo] = useState<TaskWaitReason>('fazer')
  const [canal, setCanal] = useState<TaskWaitChannel | null>(null)
  const [nota, setNota] = useState('')

  const submit = () =>
  {
    if (!start({ taskId, pessoa, amigoId, motivo, canal, nota })) return
    // o relógio da tarefa para: se o foco estava rodando nela, pausa junto
    const focus = useFocusStore.getState()
    if (focus.running && focus.targetTaskId === taskId) focus.pause()
    setPessoa('')
    setAmigoId(null)
    setNota('')
    onDone?.()
  }

  return (
    <View style={{ gap: space.md }}>
      <Field
        label="Quem"
        value={pessoa}
        onChangeText={(v) =>
        {
          setPessoa(v)
          setAmigoId(null)
        }}
        placeholder="Nome da pessoa"
        autoCapitalize="words"
        returnKeyType="done"
      />
      {friends.length + people.length > 0 ? (
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {friends.map((f) => (
              <Chip
                key={f.userId}
                label={f.displayName}
                dotColor={f.accent}
                active={amigoId === f.userId}
                onPress={() =>
                {
                  setPessoa(f.displayName)
                  setAmigoId(f.userId)
                }}
              />
            ))}
            {people.map((p) => (
              <Chip
                key={p}
                label={p}
                active={!amigoId && pessoa.trim() === p}
                onPress={() =>
                {
                  setPessoa(p)
                  setAmigoId(null)
                }}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      <View style={{ gap: 12 }}>
        <Text variant="caption" muted>
          O que falta da parte dela
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {TASK_WAIT_REASONS.map((r) => (
            <Chip key={r.id} label={r.label} active={motivo === r.id} onPress={() => setMotivo(r.id)} />
          ))}
        </View>
      </View>

      <View style={{ gap: 12 }}>
        <Text variant="caption" muted>
          Por onde você pediu
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {TASK_WAIT_CHANNELS.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              active={canal === c.id}
              onPress={() => setCanal(canal === c.id ? null : c.id)}
            />
          ))}
        </View>
      </View>

      <Field
        label="Nota (opcional)"
        value={nota}
        onChangeText={setNota}
        placeholder="O que você pediu, prazo combinado..."
        multiline
        style={{ minHeight: 72, textAlignVertical: 'top', paddingTop: 14 }}
      />

      <PrimaryButton label="Começar a esperar" icon="time-outline" disabled={!pessoa.trim()} onPress={submit} />
    </View>
  )
}

/** Aba Espera da ficha: espera atual, formulário e histórico da tarefa. */
export function TaskWaitPanel({ task }: { task: MobileTask })
{
  const { colors, space } = useTheme()
  const hydrate = useTaskWaitStore((s) => s.hydrate)
  const waits = useTaskWaitStore((s) => s.waits)
  const remove = useTaskWaitStore((s) => s.remove)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const open = task.status === 'done' ? null : openWaitFor(waits, task.id)
  const history = waitsForTask(waits, task.id).filter((w) => w.id !== open?.id)
  const totalMs = waitsForTask(waits, task.id).reduce((n, w) => n + waitMs(w, task), 0)

  return (
    <View style={{ gap: space.md }}>
      <TaskClockCard task={task} />
      {task.status !== 'done' ? <TaskPlannedHelpers task={task} editable /> : null}
      <Card style={{ gap: space.md }}>
        <View style={{ gap: 4 }}>
          <Text variant="section">Esperando alguém?</Text>
          <Text variant="caption" muted>
            Quando a tarefa depende de outra pessoa, marque aqui. O relatório mostra depois quanto tempo foi espera.
          </Text>
        </View>
        {open ? <TaskWaitOpenCard wait={open} task={task} /> : <TaskHandBack task={task} />}
        {task.status === 'done' ? (
          <Text variant="caption" muted>
            Tarefa concluída. Esperas abertas terminam na conclusão.
          </Text>
        ) : formOpen || !open ? (
          formOpen ? (
            <TaskWaitForm taskId={task.id} onDone={() => setFormOpen(false)} />
          ) : (
            <PrimaryButton
              label="Estou esperando alguém"
              variant="secondary"
              icon="people-outline"
              onPress={() => setFormOpen(true)}
            />
          )
        ) : (
          <PrimaryButton
            label="Passou para outra pessoa"
            variant="link"
            size="sm"
            onPress={() => setFormOpen(true)}
          />
        )}
      </Card>

      {history.length > 0 ? (
        <Card style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text variant="section">Histórico</Text>
            <Text variant="caption" muted>
              {formatDuration(totalMs)} de espera
            </Text>
          </View>
          {history.map((w, i) => (
            <View
              key={w.id}
              style={{
                flexDirection: 'row',
                gap: 12,
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: i === history.length - 1 ? 0 : 1,
                borderBottomColor: colors.hairline,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body">{w.pessoa}</Text>
                <Text variant="caption" muted>
                  {new Date(w.desde).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                  {` · ${formatDuration(waitMs(w, task))}`}
                  {w.cobrancas.length ? ` · ${nudgeLine(w).toLowerCase()}` : ''}
                </Text>
              </View>
              <PrimaryButton label="Apagar" variant="link" size="sm" onPress={() => remove(w.id)} />
            </View>
          ))}
        </Card>
      ) : null}
    </View>
  )
}

/** Selo da lista: "Esperando Ana · 3 d". Some quando não há espera aberta. */
export function TaskWaitBadge({ task }: { task: MobileTask })
{
  const { colors } = useTheme()
  const waits = useTaskWaitStore((s) => s.waits)
  const hydrate = useTaskWaitStore((s) => s.hydrate)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  const open = task.status === 'done' ? null : openWaitFor(waits, task.id)
  if (!open) return null
  const late = waitNeedsNudge(open)

  return (
    <View
      accessibilityLabel={`${waitHeadline(open)}, ${formatWaitAge(waitDays(open))}`}
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: colors.attentionMuted,
      }}
    >
      <Icon name={late ? 'alert-circle-outline' : 'time-outline'} size={12} color={colors.attention} />
      <Text variant="caption" style={{ color: colors.attention, fontWeight: '600', fontSize: 12 }}>
        Esperando {waitBadge(open)}
      </Text>
    </View>
  )
}

/**
 * Relógio da tarefa: conta só enquanto ela está com você. Durante a espera
 * fica pausado, e a barra separa o tempo ativo do tempo parado esperando.
 */
export function TaskClockCard({ task }: { task: MobileTask })
{
  const { colors, space } = useTheme()
  const waits = useTaskWaitStore((s) => s.waits)
  const hydrate = useTaskWaitStore((s) => s.hydrate)
  const [now, setNow] = useState(() => new Date())

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  // atualiza a cada minuto enquanto a tela está aberta
  useEffect(() =>
  {
    if (task.status === 'done') return
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [task.status])

  const split = taskTimeSplit(task, waits, now)
  if (split.totalMs <= 0) return null
  const share = split.totalMs > 0 ? Math.min(1, split.esperaMs / split.totalMs) : 0

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Icon
          name={split.pausado ? 'pause-circle-outline' : 'time-outline'}
          size={20}
          color={split.pausado ? colors.attention : colors.ink}
        />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="section">
            {task.status === 'done' ? 'Tempo da tarefa' : split.pausado ? 'Relógio pausado' : 'Relógio da tarefa'}
          </Text>
          <Text variant="caption" muted>
            {split.pausado
              ? 'Parado enquanto você espera. Volta a contar quando a pessoa responder.'
              : task.status === 'done'
                ? `Levou ${formatDuration(split.totalMs)} do início à conclusão.`
                : `Aberta há ${formatDuration(split.totalMs)}.`}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong">{formatDuration(split.ativoMs)}</Text>
          <Text variant="caption" muted>com você</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="bodyStrong" style={{ color: split.esperaMs > 0 ? colors.attention : colors.ink }}>
            {split.esperaMs > 0 ? formatDuration(split.esperaMs) : 'nada'}
          </Text>
          <Text variant="caption" muted>esperando outras pessoas</Text>
        </View>
      </View>
      {split.esperaMs > 0 ? (
        <View
          style={{
            height: 8,
            borderRadius: 999,
            backgroundColor: colors.tasksMuted,
            overflow: 'hidden',
            flexDirection: 'row',
          }}
        >
          <View style={{ width: `${Math.round(share * 100)}%`, backgroundColor: colors.attention }} />
        </View>
      ) : null}
    </Card>
  )
}

/**
 * Etapas planejadas com outras pessoas ("no meio do caminho a Ana aprova").
 * "Aguardando agora" abre a espera e pausa o relógio; a etapa sai da lista.
 */
export function TaskPlannedHelpers({ task, editable }: { task: MobileTask; editable?: boolean })
{
  const { space } = useTheme()
  const patchTask = useDataStore((s) => s.patchTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const start = useTaskWaitStore((s) => s.start)
  const waits = useTaskWaitStore((s) => s.waits)
  const helpers = parsePlannedHelpers(task.anotacao)
  const waiting = Boolean(openWaitFor(waits, task.id))

  if (!editable && helpers.length === 0) return null

  const startNow = (index: number) =>
  {
    const h = helpers[index]
    if (!h) return
    start({ taskId: task.id, pessoa: h.pessoa, amigoId: h.amigoId, motivo: h.motivo, canal: null })
    const focus = useFocusStore.getState()
    if (focus.running && focus.targetTaskId === task.id) focus.pause()
    void patchTask(task.id, { anotacao: removePlannedHelper(task.anotacao, index) }, isGuest)
  }

  return (
    <Card style={{ gap: space.md }}>
      <View style={{ gap: 4 }}>
        <Text variant="section">Pessoas nas etapas</Text>
        <Text variant="caption" muted>
          {helpers.length
            ? 'Quando chegar a vez da pessoa, toque em Aguardando agora. O relógio pausa até ela concluir.'
            : 'Alguém entra no meio do caminho? Planeje aqui e pause com um toque quando chegar a hora.'}
        </Text>
      </View>
      {helpers.map((h, i) => (
        <View key={`${h.pessoa}-${i}`} style={{ gap: 8 }}>
          <Text variant="body">{helperLine(h)}</Text>
          <View style={{ flexDirection: 'row', gap: space.md }}>
            <PrimaryButton
              label="Aguardando agora"
              size="sm"
              icon="pause-circle-outline"
              disabled={waiting}
              onPress={() => startNow(i)}
            />
            {editable ? (
              <PrimaryButton
                label="Tirar"
                variant="link"
                size="sm"
                onPress={() => void patchTask(task.id, { anotacao: removePlannedHelper(task.anotacao, i) }, isGuest)}
              />
            ) : null}
          </View>
        </View>
      ))}
      {editable ? (
        <TaskPeopleEditor
          value={[]}
          allowWhen={false}
          onChange={(added) =>
          {
            const next = [...helpers, ...added.map(({ pessoa, motivo, amigoId }) => ({ pessoa, motivo, amigoId }))]
            void patchTask(task.id, { anotacao: stampPlannedHelpers(task.anotacao, next) }, isGuest)
          }}
        />
      ) : null}
    </Card>
  )
}

/**
 * Devolver no meio da tarefa: quem já passou por ela volta com um toque
 * ("Devolver para Ana"). Abre a espera e pausa o relógio, como no começo.
 */
export function TaskHandBack({ task }: { task: MobileTask })
{
  const { space } = useTheme()
  const waits = useTaskWaitStore((s) => s.waits)
  const start = useTaskWaitStore((s) => s.start)

  const people = useMemo(() =>
  {
    const seen = new Map<string, TaskWait>()
    for (const w of waitsForTask(waits, task.id))
    {
      const key = w.pessoa.trim().toLowerCase()
      if (!seen.has(key)) seen.set(key, w)
    }
    return [...seen.values()]
  }, [waits, task.id])

  if (task.status === 'done' || openWaitFor(waits, task.id) || people.length === 0) return null

  const handBack = (w: TaskWait) =>
  {
    start({ taskId: task.id, pessoa: w.pessoa, amigoId: w.amigoId ?? null, motivo: w.motivo, canal: w.canal })
    const focus = useFocusStore.getState()
    if (focus.running && focus.targetTaskId === task.id) focus.pause()
  }

  return (
    <View style={{ gap: 8 }}>
      <Text variant="caption" muted>
        Precisa voltar para alguém? O relógio pausa até a pessoa concluir.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
        {people.map((w) => (
          <PrimaryButton
            key={w.id}
            label={`Devolver para ${w.pessoa.split(' ')[0]}`}
            variant="secondary"
            size="sm"
            icon="return-down-forward"
            onPress={() => handBack(w)}
          />
        ))}
      </View>
    </View>
  )
}
