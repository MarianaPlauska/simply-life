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
      return <WellbeingDashboardCard />
    case 'water':
      return <WaterWaveCard embedded className="w-full" />
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
