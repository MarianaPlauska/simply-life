import { useCallback, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import {
  hydrateHomeEssential,
  scheduleHomeSecondary,
} from '../../lib/hydrateHome'
import { AxelTaskDrawer } from '../kanban/AxelTaskDrawer'
import { BentoGridSkeleton } from '../ui/Skeleton'
import { DashboardCommandBar } from '../dashboard/DashboardCommandBar'
import { useDashboardMobileLayout } from '../../lib/dashboardMobilePriority'
import { DashboardMobilePriorityCard } from '../dashboard/DashboardMobilePriorityCard'
import { DashboardGlanceStrip } from '../dashboard/DashboardGlanceStrip'
import { DashboardQuickActionsCompact } from '../dashboard/DashboardQuickActionsCompact'
import { DashboardContextHero } from '../dashboard/DashboardContextHero'
import { DashboardDesktopMainFeed } from '../dashboard/DashboardDesktopMainFeed'
import { DashboardMaisBody } from '../dashboard/DashboardMaisBody'
import { AxelPostMoodCare } from '../wellbeing/AxelPostMoodCare'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { AXEL_DESKTOP_WORKSPACE, AXEL_DASHBOARD_SCOPE, AXEL_PAGE_GUTTER, AXEL_PAGE_SHELL_READING } from '../../constants/axelSurfaces'
import { DashboardDesktopRail } from '../dashboard/DashboardDesktopRail'
import { friendlyCallName } from '../../lib/friendlyCallName'
import { HealthRitualStrip } from '../wellbeing/HealthRitualStrip'
import { maybeNudgeIntencoes } from '../../lib/intencaoNudge'
import { DashboardQuickActions } from '../dashboard/DashboardQuickActions'
import { SetupQuestsSection } from '../dashboard/SetupQuestsSection'
import { DashboardChosenWidgets } from '../dashboard/DashboardChosenWidgets'

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
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const loading = useTaskStore((s) => s.dashboardLoading)
  const userProfile = useTaskStore((s) => s.userProfile)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const mobileLayout = useDashboardMobileLayout()

  useEffect(() =>
  {
    let cancelled = false
    void (async () =>
    {
      await hydrateHomeEssential()
      if (cancelled)
      {
        return
      }
      scheduleHomeSecondary()
      maybeNudgeIntencoes(useTaskStore.getState().tarefas)
    })()
    return () =>
    {
      cancelled = true
    }
  }, [])

  const greeting = getGreeting()
  const firstName = friendlyCallName(
    workspacePrefs.axel_calls_you,
    workspacePrefs.display_name,
    userProfile?.nome,
  )

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

  const openTask = useCallback((id: number) =>
  {
    setSearchParams({ task: String(id) })
  }, [setSearchParams])

  if (loading && !resumo)
  {
    return (
      <div className="w-full flex flex-col">
        <div className="h-40 sl-shimmer border-b border-line" />
        <div className={`${AXEL_PAGE_GUTTER} py-4 ${AXEL_PAGE_SHELL_READING} flex flex-col gap-3`}>
          <BentoGridSkeleton variant="default" />
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full flex flex-col flex-1 min-h-0 ${AXEL_DASHBOARD_SCOPE}`}>
      <div className={`${AXEL_PAGE_GUTTER} py-3 pt-4 md:py-6 lg:py-8 ${AXEL_PAGE_SHELL_READING} ${AXEL_DESKTOP_WORKSPACE} flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6`}>
        <div className="sl-stack-gap min-w-0">
        <DashboardCommandBar
          greeting={greeting}
          firstName={firstName}
          onOpenTask={openTask}
        />

        <SetupQuestsSection />

        <DashboardChosenWidgets />

        <nav className="flex flex-wrap gap-2" aria-label="Módulos">
          <Link to="/preferencias" className="text-[13px] text-ink-muted underline-offset-2 hover:underline min-h-11 inline-flex items-center">
            Preferências
          </Link>
          <Link to="/inteligencia" className="text-[13px] text-ink-muted underline-offset-2 hover:underline min-h-11 inline-flex items-center">
            Inteligência
          </Link>
          <Link to="/relatorios" className="text-[13px] text-ink-muted underline-offset-2 hover:underline min-h-11 inline-flex items-center">
            Relatórios
          </Link>
          <Link to="/calendario" className="text-[13px] text-ink-muted underline-offset-2 hover:underline min-h-11 inline-flex items-center">
            Calendário
          </Link>
          <Link to="/anotacoes" className="text-[13px] text-ink-muted underline-offset-2 hover:underline min-h-11 inline-flex items-center">
            Anotações
          </Link>
        </nav>

        <div className="hidden xl:block">
          <DashboardContextHero
            overdueCount={mobileLayout.overdueCount}
            saldoDisponivel={mobileLayout.cash.saldoDisponivel}
          />
        </div>

        <div className="xl:hidden space-y-3">
          <DashboardMobilePriorityCard
            priority={mobileLayout.priority}
            overdueList={mobileLayout.overdueList}
            onOpenTask={openTask}
          />
          <DashboardGlanceStrip
            chips={mobileLayout.glanceChips}
            saldoDisponivel={mobileLayout.cash.saldoDisponivel}
            aguaLabel={mobileLayout.aguaSnap ? `${mobileLayout.aguaSnap.copos}/${mobileLayout.aguaSnap.meta}` : null}
            careDone={mobileLayout.ritual.doneCount}
            careTotal={mobileLayout.ritual.totalApplicable}
            dueTotal={
              mobileLayout.dueBuckets.vencido.length
              + mobileLayout.dueBuckets.hoje.length
              + mobileLayout.dueBuckets.esta_semana.length
            }
            overdueCount={mobileLayout.overdueCount}
          />
          {mobileLayout.showCompactQuickActions && (
            <DashboardQuickActionsCompact />
          )}
        </div>

        <div className="hidden xl:block">
          <DashboardQuickActions />
        </div>

        <DashboardDesktopMainFeed />

        <AxelPostMoodCare />

        <div className="hidden xl:block">
          <HealthRitualStrip />
        </div>

        <DashboardCollapsible
          title="Mais"
          subtitle="O que não precisa agora"
          borderless
        >
          <DashboardMaisBody />
        </DashboardCollapsible>

        {selectedTask && (
          <AxelTaskDrawer
            tarefa={selectedTask}
            temporalHorizon={selectedHorizon}
            onClose={closeTaskDrawer}
          />
        )}
        </div>
        <DashboardDesktopRail />
      </div>
    </div>
  )
}
