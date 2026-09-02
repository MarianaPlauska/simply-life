import { HabitRepeatStrip } from './HabitRepeatStrip'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'

/** Hábitos extras — recolhidos para não competir com o foco principal */
export function HealthHabitsMore()
{
  return (
    <DashboardCollapsible
      title="Mais hábitos"
      subtitle="Só se fizer sentido hoje"
      borderless
      defaultOpen={false}
    >
      <HabitRepeatStrip />
    </DashboardCollapsible>
  )
}
