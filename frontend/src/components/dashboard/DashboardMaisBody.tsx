import { useMemo } from 'react'
import { YesterdayLetterCard } from './YesterdayLetterCard'
import { AxelWeekForecastCard } from './AxelWeekForecastCard'
import { InboxIACard } from './InboxIACard'
import { AtividadeRecenteCard } from './AtividadeRecenteCard'
import { DashboardModulesRegistry } from './DashboardModulesRegistry'
import { DashboardQuickWidget } from './DashboardQuickWidget'
import { DashboardPulseMetrics } from './DashboardPulseMetrics'
import { DayCapacityCard } from './DayCapacityCard'
import { StreakEveningBanner } from '../gamification/StreakEveningBanner'
import { resolveDashboardWidgets } from '../../lib/dashboardWidgets'
import { useTaskStore } from '../../store/useTaskStore'

/** Tudo que não é o check-in do dia — métricas e atalhos */
export function DashboardMaisBody()
{
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  const quickWidgets = useMemo(
    () =>
    {
      const widgets = resolveDashboardWidgets(
        workspacePrefs.dashboard_quick_widgets,
        workspacePrefs.dashboard_priority ?? 'tasks',
      )
      return widgets.filter((id) => id !== 'wellbeing' && id !== 'water')
    },
    [
      workspacePrefs.dashboard_quick_widgets,
      workspacePrefs.dashboard_priority,
    ],
  )

  const quickGridClass = quickWidgets.length <= 2
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-3xl items-start'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full items-start'

  return (
    <div className="flex flex-col gap-5">
      <DayCapacityCard />
      <DashboardPulseMetrics />
      <YesterdayLetterCard />
      <AxelWeekForecastCard />
      <StreakEveningBanner />

      {quickWidgets.length > 0 && (
        <div className={quickGridClass}>
          {quickWidgets.map((id) => (
            <div key={id} className="min-w-0 flex flex-col">
              <DashboardQuickWidget id={id} />
            </div>
          ))}
        </div>
      )}

      <DashboardModulesRegistry excludeIds={['exec', 'fin', 'saude']} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <InboxIACard embedded />
        <AtividadeRecenteCard embedded />
      </div>
    </div>
  )
}
