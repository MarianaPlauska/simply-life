import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import { AxelTaskDrawer } from '../kanban/AxelTaskDrawer'
import { Skeleton } from '../dashboard/DashboardPrimitives'
import { HolisticAnalyticsSection } from '../dashboard/HolisticAnalyticsSection'
import { DashboardCriticalTasksPreview } from '../dashboard/DashboardCriticalTasksPreview'
import { DashboardCommandBar } from '../dashboard/DashboardCommandBar'
import { DashboardModulesRegistry } from '../dashboard/DashboardModulesRegistry'
import { SystemStatePanel } from '../dashboard/SystemStatePanel'
import { QuickStatsBar } from '../dashboard/QuickStatsBar'
import { WaterWaveCard } from '../dashboard/WaterWaveCard'
import { DailyEngagementCard } from '../dashboard/DailyEngagementCard'
import { StreakEveningBanner } from '../gamification/StreakEveningBanner'
import { FinancasTabelaDensa } from '../dashboard/FinancasTabelaDensa'
import { InboxIACard } from '../dashboard/InboxIACard'
import { AtividadeRecenteCard } from '../dashboard/AtividadeRecenteCard'
import { DashboardAxelFocus } from '../dashboard/DashboardAxelFocus'
import { DashboardPulseStrip } from '../dashboard/DashboardPulseStrip'
import { DashboardPanel } from '../dashboard/DashboardPanel'

// Dashboard enterprise — comando denso, módulos, operação e analytics em sequência

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
  const fetchInbox = useTaskStore((s) => s.fetchInbox)

  const resumo = useTaskStore((s) => s.dashboardResumo)
  const loading = useTaskStore((s) => s.dashboardLoading)
  const userProfile = useTaskStore((s) => s.userProfile)

  const hasFetched = useRef(false)

  useEffect(() =>
  {
    if (hasFetched.current) return
    hasFetched.current = true
    const init = async () =>
    {
      await Promise.all([fetchDashboard(), fetchTarefas()])
      await Promise.all([fetchNotificacoes(), fetchPreferencias(), fetchGamificacaoStats?.()])
      await Promise.all([fetchPalavrasChave(), checkGoogleStatus(), fetchInbox?.()])
      await runFinanceCheck()
      await runHealthCheck()
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const greeting = getGreeting()
  const firstName = (userProfile?.nome || '').split(' ')[0] || 'Convidado'

  const taskIdParam = searchParams.get('task')
  const selectedTask = useMemo(() =>
  {
    if (!taskIdParam) return null
    const id = Number(taskIdParam)
    if (Number.isNaN(id)) return null
    return mergeDashboardTasks(storeTarefas).find((t) => t.id === id) ?? null
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
    const task = mergeDashboardTasks(storeTarefas).find((t) => t.id === taskId)
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

        <DashboardPulseStrip />

        <details className="group">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wide text-ink-muted hover:text-accent list-none flex items-center gap-2">
            <span className="group-open:rotate-90 transition-transform">▸</span>
            Módulos do sistema
          </summary>
          <div className="mt-2">
            <DashboardModulesRegistry />
          </div>
        </details>

        {/* Hero — faixa Main Quest + bento água | loop (sem coluna vazia) */}
        <div className="flex flex-col gap-3">
          <DashboardAxelFocus
            onOpenTask={openTaskDrawer}
            onExecuteTask={executeFromDashboard}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            <div id="dashboard-water" className="lg:col-span-7 min-w-0 flex scroll-mt-20">
              <WaterWaveCard hero className="flex-1" />
            </div>
            <div className="lg:col-span-5 min-w-0 flex">
              <DailyEngagementCard />
            </div>
          </div>
        </div>

        {/* 01 — Comando: execução + carga */}
        <div className="grid grid-cols-12 gap-3 items-stretch">
          <div className="col-span-12 xl:col-span-8 min-w-0">
            <DashboardCriticalTasksPreview />
          </div>
          <div className="col-span-12 xl:col-span-4 min-w-0">
            <SystemStatePanel />
          </div>
        </div>

        {/* 02 — Indicadores vitais */}
        <DashboardPanel section="02" title="Indicadores" subtitle="Saúde · finanças · ritmo diário" noPadding>
          <div className="p-4">
            <QuickStatsBar />
          </div>
        </DashboardPanel>

        {/* 03 — Finanças + inteligência */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-stretch">
          <div className="md:col-span-2 lg:col-span-6 min-w-0">
            <DashboardPanel section="03" title="Finanças" subtitle="Movimentação recente" className="h-full">
              <FinancasTabelaDensa embedded />
            </DashboardPanel>
          </div>
          <div className="min-w-0 lg:col-span-3">
            <InboxIACard />
          </div>
          <div className="min-w-0 lg:col-span-3">
            <AtividadeRecenteCard />
          </div>
        </div>

        {/* 04 — Analytics holístico (recolhido por padrão) */}
        <details className="group border-t border-line pt-2">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-2 py-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                <span className="text-accent mr-2">04</span>
                Analytics holístico
              </p>
              <p className="text-sm text-ink-muted mt-0.5">Saúde · produtividade · tendências</p>
            </div>
            <span className="font-mono text-[10px] text-accent group-open:hidden">Expandir</span>
            <span className="font-mono text-[10px] text-ink-muted hidden group-open:inline">Recolher</span>
          </summary>
          <div className="mt-2">
            <HolisticAnalyticsSection borderless />
          </div>
        </details>

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
