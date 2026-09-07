import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  FOLDER_PALETTE,
  applyTaskList,
  LIFE_CATEGORIES,
  tasksForScope,
  taskProgressPct,
  timeTriad,
  stripTaskDisplayNotes,
  formatBRL,
  txsForFolder,
  type ScopeKind,
} from '@simply-life/shared'
import { Screen, Text, PillTabs, Field, PrimaryButton, CheckRow, EmptyState, ProgressRing, Chip, PressableScale, ListRow } from '../../src/ui'
import { StackHeader } from '../../src/components/layout/StackHeader'
import { MetricTrack } from '../../src/components/metrics/MetricTrack'
import { TimeTriadCard } from '../../src/components/metrics/TimeTriadCard'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { useKanbanListsStore } from '../../src/store/kanbanListsStore'
import { useCaptureStore } from '../../src/store/captureStore'
import { FinanceExportBar } from '../../src/components/finance/FinanceExportBar'

type Tab = 'detalhes' | 'estatisticas' | 'anotacoes' | 'tarefas' | 'gastos'

function kindOf(id: string): ScopeKind
{
  if (id === 'loose') return 'loose'
  if (id.startsWith('life-')) return 'life'
  return 'user'
}

export default function PastaScreen()
{
  const { id } = useLocalSearchParams<{ id: string }>()
  const scopeId = Array.isArray(id) ? id[0] : id
  const router = useRouter()
  const { colors, space } = useTheme()
  const tasks = useDataStore((s) => s.tasks) ?? []
  const finance = useDataStore((s) => s.finance) ?? []
  const toggleTaskDone = useDataStore((s) => s.toggleTaskDone)
  const patchTask = useDataStore((s) => s.patchTask)
  const isGuest = useAuthStore((s) => s.isGuest)
  const lists = useKanbanListsStore((s) => s.lists)
  const hydrate = useKanbanListsStore((s) => s.hydrate)
  const patchList = useKanbanListsStore((s) => s.patchList)
  const removeList = useKanbanListsStore((s) => s.removeList)
  const addList = useKanbanListsStore((s) => s.addList)
  const openCapture = useCaptureStore((s) => s.openCapture)
  const [tab, setTab] = useState<Tab>('tarefas')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() =>
  {
    hydrate()
  }, [hydrate])

  const kind = kindOf(scopeId || '')
  const list = lists.find((l) => l.id === scopeId) ?? null
  const scoped = useMemo(
    () => tasksForScope(tasks, scopeId || '', lists),
    [tasks, scopeId, lists],
  )
  const folderTxs = useMemo(
    () => txsForFolder(finance, kind === 'loose' ? 'loose' : scopeId),
    [finance, kind, scopeId],
  )
  const lifeCat = LIFE_CATEGORIES.find((c) => `life-${c.id}` === scopeId)
  const title =
    list?.name ??
    lifeCat?.label ??
    (kind === 'loose' ? 'Sem pasta' : 'Pasta')

  useEffect(() =>
  {
    setName(list?.name ?? '')
    setNotes(list?.notas ?? '')
  }, [list?.id, list?.name, list?.notas])

  const done = scoped.filter((t) => t.status === 'done').length
  const pct = scoped.length > 0 ? Math.round((done / scoped.length) * 100) : 0
  const triad = timeTriad(scoped)
  const editable = kind === 'user' && Boolean(list)

  if (!scopeId)
  {
    return (
      <Screen tabBarInset={false}>
        <StackHeader title="Pasta" />
        <EmptyState title="Pasta não encontrada" body="Volte e escolha outra." />
      </Screen>
    )
  }

  return (
    <Screen scroll tabBarInset={false}>
      <StackHeader
        title={title}
        subtitle={`${scoped.length} tarefa${scoped.length === 1 ? '' : 's'} · ${folderTxs.length} gasto${folderTxs.length === 1 ? '' : 's'}`}
      />
      <View style={{ gap: space.md }}>
        <PillTabs
          tabs={[
            { id: 'tarefas', label: 'Tarefas' },
            { id: 'gastos', label: 'Gastos' },
            { id: 'detalhes', label: 'Detalhes' },
            { id: 'estatisticas', label: 'Estatísticas' },
            { id: 'anotacoes', label: 'Anotações' },
          ]}
          value={tab}
          onChange={setTab}
        />

        {tab === 'tarefas' ? (
          <View style={{ gap: 4 }}>
            {scoped.length === 0 ? (
              <EmptyState title="Pasta vazia" body="Capture uma tarefa neste escopo." icon="folder-outline" />
            ) : (
              scoped.map((t) => (
                <CheckRow
                  key={t.id}
                  title={t.titulo}
                  subtitle={t.dataVencimento ?? undefined}
                  done={t.status === 'done'}
                  showSeparator
                  onPress={() => router.push(`/task/${t.id}`)}
                  onToggle={() => void toggleTaskDone(t.id, isGuest)}
                />
              ))
            )}
            {kind === 'user' ? (
              <PrimaryButton
                label="Nova tarefa nesta pasta"
                onPress={() => openCapture('task', scopeId)}
              />
            ) : (
              <PrimaryButton
                label="Nova tarefa"
                variant="secondary"
                onPress={() => openCapture('task')}
              />
            )}
          </View>
        ) : null}

        {tab === 'gastos' ? (
          <View style={{ gap: space.md }}>
            <FinanceExportBar txs={folderTxs} title={`Relatório · ${title}`} />
            {folderTxs.length === 0 ? (
              <EmptyState
                title="Nenhum gasto nesta pasta"
                body="Lance um gasto e escolha esta pasta. Assim a viagem, a reforma ou o projeto ficam no mesmo lugar."
                icon="wallet-outline"
              />
            ) : (
              folderTxs.map((t, i, arr) => (
                <ListRow
                  key={t.id}
                  title={t.titulo}
                  subtitle={`${t.data} · ${t.tipo}`}
                  right={`${t.tipo === 'receita' ? '+' : '−'}${formatBRL(t.valor)}`}
                  showSeparator={i < arr.length - 1}
                />
              ))
            )}
            <PrimaryButton
              label="Novo gasto nesta pasta"
              onPress={() => openCapture('expense', scopeId, { studio: true })}
            />
          </View>
        ) : null}

        {tab === 'detalhes' ? (
          <View style={{ gap: space.md }}>
            {editable ? (
              <Field
                label="Nome da pasta"
                value={name}
                onChangeText={setName}
                onBlur={() =>
                {
                  const next = name.trim()
                  if (next && list) patchList(list.id, { name: next })
                }}
              />
            ) : (
              <Text variant="body" muted>
                {kind === 'life'
                  ? 'Pilar automático a partir do texto e da prioridade das tarefas.'
                  : 'Tarefas que ainda não foram colocadas em uma pasta.'}
              </Text>
            )}
            {editable ? (
              <View style={{ gap: 8 }}>
                <Text variant="caption" muted>
                  Cor
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {FOLDER_PALETTE.map((c) => (
                    <PressableScale
                      key={c}
                      accessibilityLabel={`Cor ${c}`}
                      onPress={() => list && patchList(list.id, { color: c })}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 999,
                        backgroundColor: c,
                        borderWidth: list?.color === c ? 3 : 0,
                        borderColor: colors.ink,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {kind === 'loose' && scoped.length > 0 ? (
              <View style={{ gap: 8 }}>
                <Text variant="caption" muted>
                  Mover para uma pasta
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {lists.map((l) => (
                    <Chip
                      key={l.id}
                      label={l.name}
                      onPress={() =>
                      {
                        for (const t of scoped)
                        {
                          void patchTask(t.id, { anotacao: applyTaskList(t.anotacao, l.id) }, isGuest)
                        }
                      }}
                    />
                  ))}
                </View>
                <Field
                  label="Nova pasta para estas tarefas"
                  value={name}
                  placeholder="Nome e Enter"
                  onChangeText={setName}
                  onSubmitEditing={() =>
                  {
                    const created = addList(name)
                    if (!created) return
                    for (const t of scoped)
                    {
                      void patchTask(t.id, { anotacao: applyTaskList(t.anotacao, created.id) }, isGuest)
                    }
                    router.replace(`/pasta/${created.id}` as never)
                  }}
                />
              </View>
            ) : null}
            {editable ? (
              <PrimaryButton
                label="Excluir pasta"
                variant="danger"
                onPress={() =>
                {
                  if (!list) return
                  for (const t of scoped)
                  {
                    void patchTask(t.id, { anotacao: applyTaskList(t.anotacao, null) }, isGuest)
                  }
                  removeList(list.id)
                  router.back()
                }}
              />
            ) : null}
          </View>
        ) : null}

        {tab === 'estatisticas' ? (
          <View style={{ gap: space.lg, alignItems: 'center' }}>
            <ProgressRing
              progress={pct}
              size={160}
              strokeWidth={10}
              color={list?.color ?? colors.axel}
              centerLabel={`${pct}%`}
            />
            <View style={{ width: '100%' }}>
              <MetricTrack
                pct={pct}
                currentLabel={`${done} feitas`}
                targetLabel={`${scoped.length} (${pct}%)`}
                fill={list?.color ?? colors.axel}
              />
            </View>
            <View style={{ width: '100%' }}>
              <TimeTriadCard triad={triad} />
            </View>
            {scoped.slice(0, 4).map((t) => (
              <View key={t.id} style={{ width: '100%', gap: 6 }}>
                <Text variant="caption" numberOfLines={1}>
                  {t.titulo}
                </Text>
                <MetricTrack
                  pct={taskProgressPct(t)}
                  currentLabel={`${taskProgressPct(t)}%`}
                  targetLabel={t.status === 'done' ? 'Feito' : 'Meta'}
                  fill={list?.color ?? colors.tasks}
                />
              </View>
            ))}
          </View>
        ) : null}

        {tab === 'anotacoes' ? (
          <View style={{ gap: space.md }}>
            {editable ? (
              <Field
                label="Caderno da pasta"
                value={notes}
                onChangeText={setNotes}
                onBlur={() => list && patchList(list.id, { notas: notes })}
                multiline
                placeholder="Contexto, decisões e links desta pasta"
                style={{ minHeight: 160, textAlignVertical: 'top', paddingVertical: 14 }}
              />
            ) : (
              <Text variant="body" muted>
                Anotações das tarefas deste recorte — texto livre, sem to-dos.
              </Text>
            )}
            {scoped
              .map((t) => ({ t, text: stripTaskDisplayNotes(t.anotacao) }))
              .filter((n) => n.text.length > 0)
              .map(({ t, text }) => (
                <PressableScale
                  key={t.id}
                  onPress={() => router.push(`/task/${t.id}`)}
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    backgroundColor: colors.elevated,
                    gap: 4,
                    minHeight: 56,
                  }}
                >
                  <Text variant="bodyStrong">{t.titulo}</Text>
                  <Text variant="caption" muted>
                    {text}
                  </Text>
                </PressableScale>
              ))}
          </View>
        ) : null}
      </View>
    </Screen>
  )
}
