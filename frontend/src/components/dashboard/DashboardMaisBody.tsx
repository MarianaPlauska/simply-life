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
import { AXEL_METRIC_HAIRLINE } from '../../constants/axelSurfaces'

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

  return (
    <div className="flex flex-col">
      <div className={AXEL_METRIC_HAIRLINE}>
        <DayCapacityCard />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <DashboardPulseMetrics />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3 empty:hidden`}>
        <YesterdayLetterCard />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3 empty:hidden`}>
        <AxelWeekForecastCard />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3 empty:hidden`}>
        <StreakEveningBanner />
      </div>

      {quickWidgets.map((id) => (
        <div key={id} className={`${AXEL_METRIC_HAIRLINE} mt-3 min-w-0 empty:hidden`}>
          <DashboardQuickWidget id={id} />
        </div>
      ))}

      <div className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <DashboardModulesRegistry excludeIds={['exec', 'fin', 'saude']} />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <InboxIACard embedded />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <AtividadeRecenteCard embedded />
      </div>
    </div>
  )
}
