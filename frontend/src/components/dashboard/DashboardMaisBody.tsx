import { DashboardFocusToday } from './DashboardFocusToday'
import { DashboardConsistencyStrip } from './DashboardConsistencyStrip'
import { IntentionStrip } from './IntentionStrip'
import { DashboardMoodWeek } from './DashboardMoodWeek'
import { DashboardTaskDueSection } from './DashboardTaskDueBars'
import { AtividadeRecenteCard } from './AtividadeRecenteCard'
import { HealthRitualStrip } from '../wellbeing/HealthRitualStrip'
import { AXEL_METRIC_HAIRLINE } from '../../constants/axelSurfaces'
import { ModuleSection } from '../ui/ModuleSection'

export function DashboardMaisBody()
{
  return (
    <div className="flex flex-col">
      <div className={`xl:hidden ${AXEL_METRIC_HAIRLINE}`}>
        <ModuleSection tone="tasks" label="Foco hoje">
          <DashboardFocusToday metricVariant="module" />
        </ModuleSection>
      </div>
      <div className={`xl:hidden ${AXEL_METRIC_HAIRLINE} mt-3`}>
        <DashboardTaskDueSection />
      </div>
      <div className={`xl:hidden ${AXEL_METRIC_HAIRLINE} mt-3`}>
        <DashboardMoodWeek />
      </div>
      <div className={`xl:hidden ${AXEL_METRIC_HAIRLINE} mt-3`}>
        <HealthRitualStrip />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <div className="xl:hidden">
          <DashboardConsistencyStrip compact />
        </div>
        <div className="hidden xl:block max-w-xs opacity-90">
          <DashboardConsistencyStrip compact />
        </div>
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3 empty:hidden`}>
        <IntentionStrip />
      </div>
      <div className={`${AXEL_METRIC_HAIRLINE} mt-3`}>
        <AtividadeRecenteCard embedded />
      </div>
    </div>
  )
}
