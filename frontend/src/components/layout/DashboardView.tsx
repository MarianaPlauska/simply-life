import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { resolveTemporalHorizon } from '../../lib/temporalHorizon'
import {
  fetchHomeVoiceLine,
  hydrateHomeEssential,
  scheduleHomeSecondary,
} from '../../lib/hydrateHome'
import { AxelTaskDrawer } from '../kanban/AxelTaskDrawer'
import { BentoGridSkeleton } from '../dashboard/DashboardPrimitives'
import { DashboardCommandBar } from '../dashboard/DashboardCommandBar'
import { DashboardOverdueAlert } from '../dashboard/DashboardOverdueAlert'
import { DashboardMaisBody } from '../dashboard/DashboardMaisBody'
import { AxelPostMoodCare } from '../wellbeing/AxelPostMoodCare'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import { DashboardQuickWidget } from '../dashboard/DashboardQuickWidget'
import { AXEL_PAGE_SHELL_READING } from '../../constants/axelSurfaces'
import { friendlyCallName } from '../../lib/friendlyCallName'
import { HealthRitualStrip } from '../wellbeing/HealthRitualStrip'

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
  const [voiceLine, setVoiceLine] = useState<string | null>(null)
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const loading = useTaskStore((s) => s.dashboardLoading)
  const userProfile = useTaskStore((s) => s.userProfile)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const wellbeingPending = humorHojeLista.length === 0

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
      const line = await fetchHomeVoiceLine()
      if (!cancelled)
      {
        setVoiceLine(line)
      }
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
        <div className={`px-3 sm:px-4 py-4 ${AXEL_PAGE_SHELL_READING} flex flex-col gap-3`}>
          <BentoGridSkeleton variant="default" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col flex-1 min-h-0">
      <div className={`px-3 sm:px-4 py-3 sm:py-4 ${AXEL_PAGE_SHELL_READING} flex flex-col gap-4 flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-4`}>
        <DashboardCommandBar
          greeting={greeting}
          firstName={firstName}
          voiceLine={voiceLine}
          onOpenTask={openTask}
        />

        <DashboardOverdueAlert />

        {wellbeingPending && (
          <section id="dashboard-wellbeing" className="scroll-mt-20 min-w-0" aria-label="Humor de hoje">
            <DashboardQuickWidget id="wellbeing" />
          </section>
        )}
        <AxelPostMoodCare />

        <HealthRitualStrip />

        <DashboardCollapsible
          title="Mais"
          subtitle="Métricas e atalhos"
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
    </div>
  )
}

/** @deprecated use DashboardView */
export const DashboardHome = DashboardView
