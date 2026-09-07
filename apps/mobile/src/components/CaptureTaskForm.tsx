import { useEffect, useState } from 'react'
import { View, ScrollView, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { todayIso, FOLDER_PALETTE, suggestTaskSteps, type TaskStatus } from '@simply-life/shared'
import { Text, Field, PrimaryButton, PressableScale } from '../ui'
import { useTheme } from '../theme/ThemeProvider'
import { useKanbanListsStore } from '../store/kanbanListsStore'
import { useDataStore } from '../store/dataStore'

export type CaptureTaskDraft = {
  titulo: string
  descricao: string
  status: TaskStatus
  prioridade: 1 | 2 | 3
  due: string
  hora: string
  estimativa: string
  listId: string | null
  checklist: string[]
  dependsOnId: string | null
}

const STATUS: { id: TaskStatus; label: string }[] = [
  { id: 'todo', label: 'A fazer' },
  { id: 'doing', label: 'Fazendo' },
]

const ESTIMATES = [15, 30, 45, 60, 90]

export function emptyCaptureTaskDraft(listId: string | null): CaptureTaskDraft
{
  return {
    titulo: '',
    descricao: '',
    status: 'todo',
    prioridade: 2,
    due: todayIso(),
    hora: '',
    estimativa: '30',
    listId,
    checklist: [],
    dependsOnId: null,
  }
}

export function parseCaptureHora(raw: string): number | null
{
  const m = /^(\d{1,2}):(\d{2})$/.exec(raw.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

function isoPlusDays(days: number): string
{
  const d = new Date()
  d.setDate(d.getDate() + days)
  return todayIso(d)
}

function SelectChip({
  label,
  active,
  onPress,
  dotColor,
  tone = 'axel',
}: {
  label: string
  active: boolean
  onPress: () => void
  dotColor?: string
  tone?: 'axel' | 'danger'
})
{
  const { colors } = useTheme()
  const accent = tone === 'danger' ? colors.danger : colors.axel
  const fill = tone === 'danger' ? `${colors.danger}33` : colors.axelMuted
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: 999,
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: active ? fill : colors.hairline,
        borderWidth: 1,
        borderColor: active ? accent : colors.hairline,
      }}
    >
      {dotColor ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            backgroundColor: dotColor,
          }}
        />
      ) : null}
      <Text
        variant="caption"
        style={{ fontWeight: '600', color: active ? colors.ink : colors.inkMuted }}
      >
        {label}
      </Text>
    </Pressable>
  )
}

type Props = {
  draft: CaptureTaskDraft
  onChange: (next: CaptureTaskDraft) => void
}

/** Captura de tarefa no mesmo modelo do Kanban (prazo, pasta, prioridade, tempo). */
export function CaptureTaskForm({ draft, onChange }: Props)
{
  const { colors } = useTheme()
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrateLists = useKanbanListsStore((s) => s.hydrate)
  const addList = useKanbanListsStore((s) => s.addList)
  const tasks = useDataStore((s) => s.tasks) ?? []
  const [novaLista, setNovaLista] = useState('')
  const [novaCor, setNovaCor] = useState<string>(FOLDER_PALETTE[0])
  const [criarPastaOpen, setCriarPastaOpen] = useState(false)
  const [todoDraft, setTodoDraft] = useState('')

  useEffect(() =>
  {
    hydrateLists()
  }, [hydrateLists])

  const patch = (partial: Partial<CaptureTaskDraft>) =>
  {
    onChange({ ...draft, ...partial })
  }

  const criarPasta = () =>
  {
    const created = addList(novaLista, novaCor)
    setNovaLista('')
    if (created)
    {
      patch({ listId: created.id })
      setNovaCor(FOLDER_PALETTE[(lists.length + 1) % FOLDER_PALETTE.length])
      setCriarPastaOpen(false)
    }
  }

  const addTodo = () =>
  {
    const t = todoDraft.trim()
    if (!t) return
    patch({ checklist: [...draft.checklist, t] })
    setTodoDraft('')
  }

  const outros = tasks.filter((t) => t.status !== 'done')

  return (
    <View style={{ gap: 14 }}>
      <Field tone="sand"
        label="Título"
        placeholder="O que precisa ser feito?"
        value={draft.titulo}
        onChangeText={(titulo) => patch({ titulo })}
      />

      <Field tone="sand"
        label="Descrição"
        placeholder="Contexto, critérios de pronto, pessoas..."
        multiline
        value={draft.descricao}
        onChangeText={(descricao) => patch({ descricao })}
        style={{ minHeight: 88, textAlignVertical: 'top', paddingTop: 14 }}
      />

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Text variant="caption" muted>
            To-dos nesta tarefa
          </Text>
          <PrimaryButton
            label="Sugerir passos"
            variant="ghost"
            size="sm"
            disabled={!draft.titulo.trim()}
            onPress={() =>
            {
              const steps = suggestTaskSteps(draft.titulo, draft.descricao)
              if (steps.length === 0) return
              const merged = [...draft.checklist]
              for (const step of steps)
              {
                if (!merged.some((m) => m.toLowerCase() === step.toLowerCase()))
                {
                  merged.push(step)
                }
              }
              patch({ checklist: merged })
            }}
          />
        </View>
        {draft.checklist.map((item, i) => (
          <View key={`${item}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text variant="body" style={{ flex: 1, fontSize: 14 }}>
              · {item}
            </Text>
            <PressableScale
              accessibilityLabel="Remover item"
              onPress={() =>
                patch({ checklist: draft.checklist.filter((_, j) => j !== i) })
              }
              style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="close" size={18} color={colors.inkMuted} />
            </PressableScale>
          </View>
        ))}
        <Field tone="sand"
          label="Novo item"
          placeholder="Um passo, Enter para incluir"
          value={todoDraft}
          onChangeText={setTodoDraft}
          onSubmitEditing={addTodo}
        />
        <PrimaryButton
          label="Adicionar to-do"
          variant="secondary"
          size="sm"
          disabled={!todoDraft.trim()}
          onPress={addTodo}
          style={{ backgroundColor: colors.hairline }}
        />
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Depende de outra tarefa?
        </Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SelectChip
              label="Não"
              active={!draft.dependsOnId}
              onPress={() => patch({ dependsOnId: null })}
            />
            {outros.map((t) => (
              <SelectChip
                key={t.id}
                label={t.titulo}
                active={draft.dependsOnId === t.id}
                onPress={() => patch({ dependsOnId: t.id })}
              />
            ))}
          </View>
        </ScrollView>
        {outros.length === 0 ? (
          <Text variant="caption" muted>
            Nenhuma tarefa aberta para vincular.
          </Text>
        ) : null}
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Status
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STATUS.map((s) => (
            <SelectChip
              key={s.id}
              label={s.label}
              active={draft.status === s.id}
              onPress={() => patch({ status: s.id })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Prioridade
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {([1, 2, 3] as const).map((p) => (
            <SelectChip
              key={p}
              label={p === 1 ? 'Alta' : p === 2 ? 'Média' : 'Baixa'}
              active={draft.prioridade === p}
              tone={p === 1 ? 'danger' : 'axel'}
              onPress={() => patch({ prioridade: p })}
            />
          ))}
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Prazo
        </Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SelectChip
              label="Hoje"
              active={draft.due === todayIso()}
              onPress={() => patch({ due: todayIso() })}
            />
            <SelectChip
              label="Amanhã"
              active={draft.due === isoPlusDays(1)}
              onPress={() => patch({ due: isoPlusDays(1) })}
            />
            <SelectChip
              label="Sem prazo"
              active={!draft.due}
              onPress={() => patch({ due: '' })}
            />
          </View>
        </ScrollView>
        <Field tone="sand"
          label="Data (AAAA-MM-DD)"
          value={draft.due}
          placeholder="2026-09-10"
          onChangeText={(due) => patch({ due })}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field tone="sand"
            label="Horário (HH:MM)"
            value={draft.hora}
            placeholder="09:30"
            onChangeText={(hora) => patch({ hora })}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field tone="sand"
            label="Estimativa (min)"
            value={draft.estimativa}
            keyboardType="number-pad"
            onChangeText={(estimativa) => patch({ estimativa })}
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text variant="caption" muted>
          Tempo estimado
        </Text>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {ESTIMATES.map((n) => (
              <SelectChip
                key={n}
                label={`${n} min`}
                active={draft.estimativa === String(n)}
                onPress={() => patch({ estimativa: String(n) })}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="caption" muted>
            Pasta / grupo
          </Text>
          <PressableScale
            accessibilityLabel="Criar nova pasta"
            onPress={() => setCriarPastaOpen((v) => !v)}
            style={{
              minHeight: 36,
              minWidth: 36,
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: criarPastaOpen ? colors.axelMuted : colors.hairline,
            }}
          >
            <Ionicons name={criarPastaOpen ? 'close' : 'add'} size={20} color={colors.axel} />
          </PressableScale>
        </View>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <SelectChip
              label="Nenhuma"
              active={!draft.listId}
              onPress={() => patch({ listId: null })}
            />
            {lists.map((l) => (
              <SelectChip
                key={l.id}
                label={l.name}
                dotColor={l.color}
                active={draft.listId === l.id}
                onPress={() => patch({ listId: l.id })}
              />
            ))}
          </View>
        </ScrollView>
        {criarPastaOpen ? (
          <View style={{ gap: 8 }}>
            <Field tone="sand"
              label="Nova pasta"
              placeholder="Nome da pasta"
              value={novaLista}
              onChangeText={setNovaLista}
              onSubmitEditing={criarPasta}
            />
            <Text variant="caption" muted>
              Cor da pasta
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FOLDER_PALETTE.map((c) => (
                <Pressable
                  key={c}
                  accessibilityRole="button"
                  accessibilityLabel={`Cor ${c}`}
                  accessibilityState={{ selected: novaCor === c }}
                  onPress={() => setNovaCor(c)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: c,
                    borderWidth: novaCor === c ? 3 : 0,
                    borderColor: colors.ink,
                  }}
                />
              ))}
            </View>
            <PrimaryButton
              label="Criar pasta"
              variant="secondary"
              size="sm"
              disabled={!novaLista.trim()}
              onPress={criarPasta}
            />
          </View>
        ) : null}
      </View>
    </View>
  )
}
