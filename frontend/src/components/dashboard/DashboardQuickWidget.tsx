import type { DashboardWidgetId } from '../../lib/dashboardWidgets'
import { WellbeingDashboardCard } from '../wellbeing/WellbeingDashboardCard'
import { WaterWaveCard } from './WaterWaveCard'
import { MedicamentosBulkPanel } from '../Health/MedicamentosBulkPanel'
import DashboardCriticalTasksPreview from './DashboardCriticalTasksPreview'
import { FinanceDailyBriefCard } from '../Finance/overview/FinanceDailyBriefCard'

export function DashboardQuickWidget({ id }: { id: DashboardWidgetId })
{
  switch (id)
  {
    case 'wellbeing':
      return (
        <div id="dashboard-wellbeing" className="scroll-mt-20 min-w-0">
          <WellbeingDashboardCard />
        </div>
      )
    case 'water':
      return (
        <div id="dashboard-water" className="scroll-mt-20 min-w-0">
          <WaterWaveCard hero={false} className="w-full" />
        </div>
      )
    case 'medicamentos':
      return <MedicamentosBulkPanel variant="compact" />
    case 'critical_tasks':
      return <DashboardCriticalTasksPreview />
    case 'finance_brief':
    case 'quick_spend':
      return <FinanceDailyBriefCard compact />
    default:
      return null
  }
}
