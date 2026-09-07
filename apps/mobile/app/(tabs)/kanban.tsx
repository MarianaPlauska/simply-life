import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { syncGmailNow, type AxelDecisionEvent } from '@simply-life/shared'
import {
  Screen,
  PillTabs,
  PrimaryButton,
  SubNavTabs,
} from '../../src/ui'
import { useTheme } from '../../src/theme/ThemeProvider'
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
import { KanbanReportsPane } from '../../src/components/kanban/KanbanReportsPane'
import { KanbanOverviewPane } from '../../src/components/kanban/KanbanOverviewPane'
import { KanbanRoutinePane } from '../../src/components/kanban/KanbanRoutinePane'
import { authedApi } from '../../src/lib/integrationsApi'

type Hub = 'board' | 'lista' | 'feitas' | 'pastas' | 'rotina' | 'gantt' | 'relatorios'
type ReportMode = 'desempenho' | 'overview' | 'calendario' | 'timeline' | 'ritmo'

export default function KanbanScreen()
{
  const { space } = useTheme()
  const [hub, setHub] = useState<Hub>('lista')
  const [report, setReport] = useState<ReportMode>('desempenho')
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

  const events: AxelDecisionEvent[] = history
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

  return (
    <Screen
      scroll
      refreshing={loading}
      onRefresh={() => void refreshAll({ isGuest })}
    >
      <TabShell>
        <ScreenIntro title="Tarefas" subtitle="Lista, rotina, pastas e Gantt — mesmo escopo, várias lentes." />

        {hub === 'board' || hub === 'lista' || hub === 'pastas' ? (
          <KanbanOrchestratorBar tasks={tasks} />
        ) : null}

        <SubNavTabs
          accent="axel"
          tabs={[
            { id: 'lista', label: 'Lista' },
            { id: 'feitas', label: 'Feitas', count: doneCount },
            { id: 'rotina', label: 'Rotina' },
            { id: 'pastas', label: 'Pastas' },
            { id: 'board', label: 'Board', count: openCount },
            { id: 'gantt', label: 'Gantt' },
            { id: 'relatorios', label: 'Relatórios' },
          ]}
          value={hub}
          onChange={setHub}
        />

        {hub === 'relatorios' ? (
          <View style={{ marginTop: space.sm, gap: space.sm }}>
            <PillTabs
              tabs={[
                { id: 'desempenho', label: 'Desempenho' },
                { id: 'overview', label: 'Overview' },
                { id: 'calendario', label: 'Calendário' },
                { id: 'timeline', label: 'Timeline' },
                { id: 'ritmo', label: 'Ritmo' },
              ]}
              value={report}
              onChange={setReport}
            />
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <PrimaryButton
                label="Decision log"
                variant="ghost"
                size="sm"
                onPress={() => setLogOpen(true)}
              />
              <PrimaryButton
                label="Sincronizar Gmail"
                variant="ghost"
                size="sm"
                disabled={isGuest}
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
          {hub === 'relatorios' && report === 'calendario' ? <KanbanCalendarPane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'timeline' ? <KanbanTimelinePane tasks={tasks} /> : null}
          {hub === 'relatorios' && report === 'ritmo' ? <KanbanActivityComplex tasks={tasks} /> : null}
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
