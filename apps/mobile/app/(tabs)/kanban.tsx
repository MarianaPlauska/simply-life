import { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { syncGmailNow, type AxelDecisionEvent } from '@simply-life/shared'
import {
  Screen,
  PrimaryButton,
  SubNavTabs,
} from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
import { useModules } from '../../src/hooks/useModules'
import { useDataStore } from '../../src/store/dataStore'
import { useAuthStore } from '../../src/store/authStore'
import { useGamificationStore } from '../../src/store/gamificationStore'
import { ScreenIntro } from '../../src/components/dashboard/ScreenIntro'
import { TabShell } from '../../src/components/dashboard/TabShell'
import { DueBucketColumns } from '../../src/components/kanban/DueBucketColumns'
import { KanbanCalendarPane } from '../../src/components/kanban/KanbanCalendarPane'
import { KanbanGanttPane } from '../../src/components/kanban/KanbanGanttPane'
import { KanbanListPane } from '../../src/components/kanban/KanbanListPane'
import { KanbanDonePane } from '../../src/components/kanban/KanbanDonePane'
import { KanbanTimelinePane } from '../../src/components/kanban/KanbanTimelinePane'
import { KanbanOrchestratorBar } from '../../src/components/kanban/KanbanOrchestratorBar'
import { KanbanDecisionLogSheet } from '../../src/components/kanban/KanbanDecisionLogSheet'
import { KanbanActivityComplex } from '../../src/components/kanban/KanbanActivityComplex'
import { KanbanFoldersPane } from '../../src/components/kanban/KanbanFoldersPane'
import { KanbanBackdrop } from '../../src/components/kanban/KanbanBackdrop'
import { KanbanReportsPane } from '../../src/components/kanban/KanbanReportsPane'
import { KanbanOverviewPane } from '../../src/components/kanban/KanbanOverviewPane'
import { KanbanRoutinePane } from '../../src/components/kanban/KanbanRoutinePane'
import { WeeklyReviewPane } from '../../src/components/kanban/reports/WeeklyReviewPane'
import { RitmoInsights } from '../../src/components/kanban/reports/RitmoInsights'
import { WaitingReportPane } from '../../src/components/kanban/reports/WaitingReportPane'
import { authedApi } from '../../src/lib/integrationsApi'
import { fetchDecisionEvents } from '../../src/lib/sync/decisionLog'
import { useBoardReplanStore } from '../../src/store/boardReplanStore'

type Hub = 'board' | 'lista' | 'feitas' | 'pastas' | 'rotina' | 'calendario' | 'gantt' | 'relatorios'
type ReportMode = 'semana' | 'esperas' | 'desempenho' | 'overview' | 'timeline' | 'ritmo'

export default function KanbanScreen()
{
  const { relatorio } = useLocalSearchParams<{ relatorio?: string }>()
  const { space } = useTheme()
  const modules = useModules()
  const [hub, setHub] = useState<Hub>(() =>
    relatorio === 'esperas' ? 'relatorios' : modules.on('tasks') ? 'lista' : 'rotina')
  const [report, setReport] = useState<ReportMode>(relatorio === 'esperas' ? 'esperas' : 'semana')
  const [logOpen, setLogOpen] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const tasks = useDataStore((s) => s.tasks) ?? []
  const loading = useDataStore((s) => s.loading)
  const refreshAll = useDataStore((s) => s.refreshAll)
  const isGuest = useAuthStore((s) => s.isGuest)
  const history = useGamificationStore((s) => s.history)
  const logEvent = useGamificationStore((s) => s.logEvent)
  const openCount = useMemo(
    () => tasks.filter((t) => t.status !== 'done').length,
    [tasks],
  )
  const doneCount = useMemo(
    () => tasks.filter((t) => t.status === 'done').length,
    [tasks],
  )

  const lastBatch = useBoardReplanStore((s) => s.lastBatch)
  const [remoteEvents, setRemoteEvents] = useState<AxelDecisionEvent[]>([])

  useEffect(() =>
  {
    if (!logOpen || isGuest) return
    const since = new Date(Date.now() - 30 * 86400000).toISOString()
    void fetchDecisionEvents(since).then(setRemoteEvents)
  }, [logOpen, isGuest, lastBatch])

  // Convidado/offline: o último lote do Axel vem da memória local
  const localBatchEvents: AxelDecisionEvent[] = lastBatch
    ? lastBatch.moves.map((m) => ({
        id: `${lastBatch.id}-${m.taskId}`,
        user_id: 'local',
        task_id: null,
        kind: m.kind,
        rationale: m.reason,
        score: null,
        horizon: m.to,
        created_at: lastBatch.at,
        batch_id: lastBatch.id,
        from_date: m.from,
        to_date: m.to,
        undone_at: lastBatch.undone.includes(m.taskId) ? lastBatch.at : null,
      }))
    : []

  const localEvents: AxelDecisionEvent[] = history
    .filter((h) => h.kind === 'decision')
    .map((h) => ({
      id: h.id,
      user_id: 'local',
      task_id: null,
      kind: 'manual_override',
      rationale: h.detail ?? h.title,
      score: null,
      horizon: null,
      created_at: h.at,
    }))

  const events: AxelDecisionEvent[] = remoteEvents.length
    ? [...remoteEvents, ...localEvents]
    : [...localBatchEvents, ...localEvents]

  // Rotina só com o módulo Rotina; o resto é do módulo Tarefas
  const hubTabs = ([
    { id: 'lista', label: 'Lista' },
    { id: 'feitas', label: 'Feitas', count: doneCount },
    { id: 'rotina', label: 'Rotina' },
    { id: 'pastas', label: 'Pastas' },
    { id: 'board', label: 'Prazos', count: openCount },
    // calendário é um jeito de ver as tarefas, não um relatório
    { id: 'calendario', label: 'Calendário' },
    { id: 'gantt', label: 'Gantt' },
    { id: 'relatorios', label: 'Relatórios' },
  ] as { id: Hub; label: string; count?: number }[]).filter((t) =>
    t.id === 'rotina' ? modules.on('routine') : modules.on('tasks'))
  const hubShown = hubTabs.some((t) => t.id === hub) ? hub : (hubTabs[0]?.id ?? hub)
  useEffect(() =>
  {
    if (hubShown !== hub) setHub(hubShown)
  }, [hubShown, hub])

  return (
    <Screen
      scroll
      backdrop={<KanbanBackdrop />}
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <ScreenIntro title="Tarefas" subtitle="Uma coisa de cada vez, no seu ritmo." />

        {hub === 'board' || hub === 'lista' || hub === 'pastas' ? (
          <KanbanOrchestratorBar tasks={tasks} />
        ) : null}

        {/* abas mais perto do título: o conteúdo da aba sobe junto */}
        <View style={{ marginTop: -12 }}>
          <SubNavTabs
            accent="axel"
            tabs={hubTabs}
            value={hub}
            onChange={setHub}
          />
        </View>

        {hub === 'relatorios' ? (
          <View style={{ gap: space.xs }}>
            {/* sub-abas no mesmo sublinhado do resto do app, sem pílula escura */}
            <SubNavTabs
              accent="axel"
              tabs={[
                { id: 'semana', label: 'Semana' },
                { id: 'esperas', label: 'Esperas' },
                { id: 'desempenho', label: 'Desempenho' },
                { id: 'overview', label: 'Visão geral' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'ritmo', label: 'Ritmo' },
              ]}
              value={report}
              onChange={setReport}
            />
            {/* ações secundárias como links, numa linha só; Gmail só aparece com conta */}
            <View style={{ flexDirection: 'row', gap: space.md, flexWrap: 'wrap', alignItems: 'center' }}>
              <PrimaryButton
                label="Histórico de decisões"
                icon="reload-outline"
                variant="link"
                size="sm"
                onPress={() => setLogOpen(true)}
              />
              {!isGuest ? (
              <PrimaryButton
                label="Sincronizar Gmail"
                icon="mail-outline"
                variant="link"
                size="sm"
                onPress={() =>
                {
                  void (async () =>
                  {
                    try
                    {
                      const api = await authedApi()
                      const r = await syncGmailNow(api)
                      setSyncMsg(`${r.tarefas_geradas} tarefa(s) de ${r.emails_lidos} e-mail(s)`)
                      logEvent(
                        'system',
                        'Sync Gmail',
                        `${r.tarefas_geradas} tarefas de ${r.emails_lidos} emails`,
                      )
                      await refreshAll({ isGuest })
                    }
                    catch (e)
                    {
                      setSyncMsg(e instanceof Error ? e.message : 'Sync indisponível')
                    }
                  })()
                }}
              />
              ) : null}
            </View>
            {syncMsg ? (
              <PrimaryButton label={syncMsg} variant="link" onPress={() => setSyncMsg('')} />
            ) : null}
          </View>
        ) : null}

        <View style={{ marginTop: space.sm }}>
          {hub === 'lista' ? (
            <KanbanListPane tasks={tasks} onSeeDone={() => setHub('feitas')} />
          ) : null}
          {hub === 'feitas' ? <KanbanDonePane tasks={tasks} /> : null}
          {hub === 'rotina' ? <KanbanRoutinePane /> : null}
          {hub === 'pastas' ? <KanbanFoldersPane tasks={tasks} /> : null}
          {hub === 'board' ? <DueBucketColumns tasks={tasks} /> : null}
          {hub === 'gantt' ? <KanbanGanttPane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'desempenho' ? <KanbanReportsPane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'overview' ? <KanbanOverviewPane tasks={tasks} /> : null}
          {hub === 'calendario' ? <KanbanCalendarPane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'timeline' ? <KanbanTimelinePane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'semana' ? <WeeklyReviewPane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'esperas' ? <WaitingReportPane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'ritmo' ? (
            <View style={{ gap: space.md }}>
              <KanbanActivityComplex tasks={tasks} />
              <RitmoInsights tasks={tasks} />
            </View>
          ) : null}
        </View>
      </TabShell>
      <KanbanDecisionLogSheet
        visible={logOpen}
        events={events}
        onClose={() => setLogOpen(false)}
      />
    </Screen>
  )
}
