import type { MobileTask } from '@simply-life/shared'
import { PlansCalendar } from '../calendar/PlansCalendar'

type Props = {
  tasks: MobileTask[]
}

/** Mesmo layout de Planos (moedas/categorias) dentro do Kanban */
export function KanbanCalendarPane({ tasks }: Props)
{
  return <PlansCalendar tasks={tasks} />
}
