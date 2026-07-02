import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import { AxelTaskDrawer } from '../kanban/AxelTaskDrawer'
import { Skeleton } from '../dashboard/DashboardPrimitives'
import { DashboardCommandBar } from '../dashboard/DashboardCommandBar'
import { DashboardOverdueAlert } from '../dashboard/DashboardOverdueAlert'
import { DashboardModulesRegistry } from '../dashboard/DashboardModulesRegistry'
import { HealthRitualStrip } from '../wellbeing/HealthRitualStrip'
import { AxelPostMoodCare } from '../wellbeing/AxelPostMoodCare'
import { StreakEveningBanner } from '../gamification/StreakEveningBanner'
import { InboxIACard } from '../dashboard/InboxIACard'
import { AtividadeRecenteCard } from '../dashboard/AtividadeRecenteCard'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { DashboardQuickWidget } from '../dashboard/DashboardQuickWidget'
import { DashboardAnalyticsPanel } from '../dashboard/DashboardAnalyticsPanel'
import { resolveDashboardWidgets } from '../../lib/dashboardWidgets'
import { AXEL_PAGE_SHELL } from '../../constants/axelSurfaces'

function getGreeting(): string
{
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function DashboardView()
{
  const [searchParams, setSearchParams] = useSearchParams()
  const storeTarefas = useTaskStore((s) => s.tarefas)

  const fetchDashboard = useTaskStore((s) => s.fetchDashboard)
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const fetchNotificacoes = useTaskStore((s) => s.fetchNotificacoes)
  const fetchPreferencias = useTaskStore((s) => s.fetchPreferencias)
  const fetchPalavrasChave = useTaskStore((s) => s.fetchPalavrasChave)
  const checkGoogleStatus = useTaskStore((s) => s.checkGoogleStatus)
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck)
  const runHealthCheck = useTaskStore((s) => s.runHealthCheck)
  const fetchGamificacaoStats = useTaskStore((s) => s.fetchGamificacaoStats)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)
  const fetchInbox = useTaskStore((s) => s.fetchInbox)
  const fetchHumorResumo = useTaskStore((s) => s.fetchHumorResumo)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)

  const resumo = useTaskStore((s) => s.dashboardResumo)
  const loading = useTaskStore((s) => s.dashboardLoading)
  const userProfile = useTaskStore((s) => s.userProfile)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  const hasFetched = useRef(false)

  useEffect(() =>
  {
    if (hasFetched.current) return
    hasFetched.current = true
    const init = async () =>
    {
      await Promise.all([fetchDashboard(), fetchTarefas()])
      await Promise.all([fetchNotificacoes(), fetchPreferencias(), fetchGamificacaoStats?.()])
      syncStreakCalendarDay()
      await Promise.all([fetchPalavrasChave(), checkGoogleStatus(), fetchInbox?.(), fetchHumorResumo(), fetchContasFixas()])
      await runFinanceCheck()
      await runHealthCheck()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const greeting = getGreeting()
  const firstName = workspacePrefs.axel_calls_you
    || (workspacePrefs.display_name || userProfile?.nome || '').split(' ')[0]
    || 'Convidado'

  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const wellbeingPending = humorHojeLista.length === 0

  const quickWidgets = useMemo(
    () =>
    {
      const widgets = resolveDashboardWidgets(
        workspacePrefs.dashboard_quick_widgets,
        workspacePrefs.dashboard_priority ?? 'tasks',
      )
      // Humor tem bloco próprio (AxelPostMoodCare / card no topo) — nunca ocupa coluna vazia no grid
      return widgets.filter((id) => id !== 'wellbeing')
    },
    [
      workspacePrefs.dashboard_quick_widgets,
      workspacePrefs.dashboard_priority,
    ],
  )

  const quickGridClass = quickWidgets.length <= 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl items-start'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full items-start'

  const quickWidgetSpan = () => 'min-w-0 flex flex-col'

  const taskIdParam = searchParams.get('task')
  const selectedTask = useMemo(() =>
  {
    if (!taskIdParam) return null
    const id = Number(taskIdParam)
    if (Number.isNaN(id)) return null
    return storeTarefas.find((t) => t.id === id) ?? null
  }, [taskIdParam, storeTarefas])

  const selectedHorizon = useMemo(() =>
  {
    if (!selectedTask) return 'hoje' as const
    return resolveTemporalHorizon(selectedTask)
  }, [selectedTask])

  const closeTaskDrawer = useCallback(() =>
  {
    setSearchParams({})
  }, [setSearchParams])

  if (loading && !resumo)
  {
    return (
      <div className="w-full flex flex-col">
        <div className="h-40 bg-chrome border-b border-line animate-pulse" />
        <div className={`px-4 lg:px-8 py-4 ${AXEL_PAGE_SHELL} flex flex-col gap-3`}>
          <Skeleton className="h-28 w-full" />
          <div className="grid grid-cols-12 gap-3">
            <Skeleton className="col-span-8 h-64" />
            <Skeleton className="col-span-4 h-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <DashboardCommandBar greeting={greeting} firstName={firstName} />

      <div className={`px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 ${AXEL_PAGE_SHELL} flex flex-col gap-3 sm:gap-4 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4`}>
        {wellbeingPending && (
          <div className="order-first shrink-0">
            <DashboardQuickWidget id="wellbeing" />
          </div>
        )}
        <div id="dashboard-wellbeing" className="scroll-mt-20 min-w-0">
          <AxelPostMoodCare />
        </div>
        <StreakEveningBanner />
        <DashboardOverdueAlert />
        <HealthRitualStrip />

        {quickWidgets.length > 0 && (
          <div className={quickGridClass}>
            {quickWidgets.map((id) => (
              <div key={id} className={quickWidgetSpan()}>
                <DashboardQuickWidget id={id} />
              </div>
            ))}
          </div>
        )}

        <DashboardAnalyticsPanel />

        <DashboardCollapsible
          title="Mais"
          subtitle="Módulos · integrações · atividade"
        >
          <div className="flex flex-col gap-3">
            <DashboardModulesRegistry excludeIds={['exec', 'fin', 'saude']} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <InboxIACard embedded />
              <AtividadeRecenteCard embedded />
            </div>
          </div>
        </DashboardCollapsible>

        {selectedTask && (
          <AxelTaskDrawer
            tarefa={selectedTask}
            temporalHorizon={selectedHorizon}
            onClose={closeTaskDrawer}
          />
        )}
      </div>
    </div>
  )
}

/** @deprecated use DashboardView */
export const DashboardHome = DashboardView
