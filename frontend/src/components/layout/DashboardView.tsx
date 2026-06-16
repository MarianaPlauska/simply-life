import { useCallback, useEffect, useMemo, useRef, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import { AxelTaskDrawer } from '../kanban/AxelTaskDrawer'
import { Skeleton } from '../dashboard/DashboardPrimitives'
import { HolisticAnalyticsSection } from '../dashboard/HolisticAnalyticsSection'
import { DashboardCriticalTasksPreview } from '../dashboard/DashboardCriticalTasksPreview'
import { DashboardCommandBar } from '../dashboard/DashboardCommandBar'
import { DashboardModulesRegistry } from '../dashboard/DashboardModulesRegistry'
import { SystemStatePanel } from '../dashboard/SystemStatePanel'
import { WaterWaveCard } from '../dashboard/WaterWaveCard'
import { HealthRitualStrip } from '../wellbeing/HealthRitualStrip'
import { WellbeingDashboardCard } from '../wellbeing/WellbeingDashboardCard'
import { StreakEveningBanner } from '../gamification/StreakEveningBanner'
import { FinancasTabelaDensa } from '../dashboard/FinancasTabelaDensa'
import { DashboardFinanceMoodStrip } from '../dashboard/DashboardFinanceMoodStrip'
import { DashboardFinanceMonthGoal } from '../dashboard/DashboardFinanceMonthGoal'
import { FinanceDailyBriefCard } from '../Finance/overview/FinanceDailyBriefCard'
import { CardQuickSpendStrip } from '../Finance/CardQuickSpendStrip'
import { WeeklyEpisodeCard } from '../gamification/WeeklyEpisodeCard'
import { InboxIACard } from '../dashboard/InboxIACard'
import { AtividadeRecenteCard } from '../dashboard/AtividadeRecenteCard'
import { FinanceBillsAlertCard } from '../dashboard/FinanceBillsAlertCard'
import { DashboardHeroPanel } from '../dashboard/DashboardHeroPanel'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import type { DashboardPriority } from '../../lib/userWorkspacePrefs'

// Dashboard enxuto — ofensiva + foco no topo; ordem por preferência do wizard

function getGreeting(): string
{
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

const BLOCK_ORDER: Record<DashboardPriority, ('health' | 'tasks' | 'finance')[]> = {
  finance: ['finance', 'tasks', 'health'],
  tasks: ['tasks', 'health', 'finance'],
  health: ['health', 'tasks', 'finance'],
}

export function DashboardView()
{
  const [searchParams, setSearchParams] = useSearchParams()
  const { startTask } = useStartTaskExecution()
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

  const sectionOrder = BLOCK_ORDER[workspacePrefs.dashboard_priority] ?? BLOCK_ORDER.tasks

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

  const openTaskDrawer = useCallback((taskId: number) =>
  {
    setSearchParams({ task: String(taskId) })
  }, [setSearchParams])

  const closeTaskDrawer = useCallback(() =>
  {
    setSearchParams({})
  }, [setSearchParams])

  const executeFromDashboard = useCallback((taskId: number) =>
  {
    const task = storeTarefas.find((t) => t.id === taskId)
    if (!task) return
    openTaskDrawer(taskId)
    void startTask(task)
  }, [storeTarefas, openTaskDrawer, startTask])

  if (loading && !resumo)
  {
    return (
      <div className="w-full flex flex-col">
        <div className="h-40 bg-chrome border-b border-line animate-pulse" />
        <div className="px-4 lg:px-8 py-4 max-w-[1600px] mx-auto w-full flex flex-col gap-3">
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

      <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 max-w-[1600px] mx-auto w-full flex flex-col gap-3 sm:gap-4 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4">
        <StreakEveningBanner />

        <DashboardHeroPanel
          onOpenTask={openTaskDrawer}
          onExecuteTask={executeFromDashboard}
        />

        <CardQuickSpendStrip variant="dashboard" prominent />

        <WeeklyEpisodeCard embedded />

        {sectionOrder.map((block) =>
        {
          if (block === 'health')
          {
            return (
              <Fragment key="health">
                <HealthRitualStrip />
                <DashboardCollapsible
                  title="Rotina rápida"
                  subtitle="Água e humor — o restante fica em Saúde"
                  defaultOpen
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    <div id="dashboard-water" className="min-w-0 flex scroll-mt-20">
                      <WaterWaveCard hero className="flex-1" />
                    </div>
                    <div className="min-w-0 flex">
                      <WellbeingDashboardCard />
                    </div>
                  </div>
                </DashboardCollapsible>
              </Fragment>
            )
          }

          if (block === 'tasks')
          {
            return (
              <DashboardCollapsible
                key="tasks"
                section="01"
                title="Comando"
                subtitle="Tarefas críticas e carga do sistema"
                defaultOpen
              >
                <div className="grid grid-cols-12 gap-3 items-stretch">
                  <div className="col-span-12 xl:col-span-8 min-w-0">
                    <DashboardCriticalTasksPreview />
                  </div>
                  <div className="col-span-12 xl:col-span-4 min-w-0">
                    <SystemStatePanel />
                  </div>
                </div>
              </DashboardCollapsible>
            )
          }

          return (
            <Fragment key="finance">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                <DashboardFinanceMoodStrip />
                <DashboardFinanceMonthGoal />
              </div>
              <DashboardCollapsible
                section="02"
                title="Finanças detalhadas"
                subtitle="Faturas, resumo e movimentação"
              >
                <div className="flex flex-col gap-3">
                  <FinanceBillsAlertCard />
                  <FinanceDailyBriefCard compact />
                  <FinancasTabelaDensa embedded />
                </div>
              </DashboardCollapsible>
            </Fragment>
          )
        })}

        <DashboardCollapsible
          title="Mais"
          subtitle="Módulos · inteligência · auditoria · analytics"
        >
          <div className="flex flex-col gap-3">
            <DashboardModulesRegistry />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <InboxIACard embedded />
              <AtividadeRecenteCard embedded />
            </div>
            <HolisticAnalyticsSection borderless />
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
