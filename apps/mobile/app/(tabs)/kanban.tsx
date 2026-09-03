import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { syncGmailNow, type AxelDecisionEvent } from '@simply-life/shared'
import {
  Screen,
  PillTabs,
  PrimaryButton,
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
import { KanbanTimelinePane } from '../../src/components/kanban/KanbanTimelinePane'
import { KanbanOverviewPane } from '../../src/components/kanban/KanbanOverviewPane'
import { KanbanOrchestratorBar } from '../../src/components/kanban/KanbanOrchestratorBar'
import { KanbanDecisionLogSheet } from '../../src/components/kanban/KanbanDecisionLogSheet'
import { authedApi } from '../../src/lib/integrationsApi'

type ViewMode = 'overview' | 'colunas' | 'lista' | 'timeline' | 'calendario' | 'gantt'

export default function KanbanScreen()
{
  const { space } = useTheme()
  const [mode, setMode] = useState<ViewMode>('overview')
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
        <ScreenIntro
          title="Tarefas"
          subtitle="Overview, colunas e análise - mesma fonte."
        />

        {mode !== 'overview' ? <KanbanOrchestratorBar tasks={tasks} /> : null}

        {mode !== 'overview' ? (
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <PrimaryButton
              label="Decision log"
              variant="secondary"
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
        ) : null}
        {syncMsg ? (
          <PrimaryButton label={syncMsg} variant="link" onPress={() => setSyncMsg('')} />
        ) : null}

        <PillTabs
          tabs={[
            { id: 'overview', label: 'Overview', count: openCount },
            { id: 'colunas', label: 'Colunas' },
            { id: 'lista', label: 'Lista' },
            { id: 'timeline', label: 'Timeline' },
            { id: 'calendario', label: 'Calendário' },
            { id: 'gantt', label: 'Gantt' },
          ]}
          value={mode}
          onChange={setMode}
        />

        <View style={{ marginTop: space.sm }}>
          {mode === 'overview' ? <KanbanOverviewPane tasks={tasks} /> : null}
          {mode === 'colunas' ? <DueBucketColumns tasks={tasks} /> : null}
          {mode === 'lista' ? <KanbanListPane tasks={tasks} /> : null}
          {mode === 'timeline' ? <KanbanTimelinePane tasks={tasks} /> : null}
          {mode === 'calendario' ? <KanbanCalendarPane tasks={tasks} /> : null}
          {mode === 'gantt' ? <KanbanGanttPane tasks={tasks} /> : null}
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
