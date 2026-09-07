export type LifeGoalCadence = 'week' | 'month'

export type LifeGoalCategory =
  | 'finance'
  | 'sleep'
  | 'mental'
  | 'task'
  | 'health'
  | 'custom'

export type LifeGoal = {
  title: string
  category: LifeGoalCategory
  cadence: LifeGoalCadence
  /** ISO date (YYYY-MM-DD) em que a meta foi definida */
  periodStart: string
}

export const LIFE_GOAL_TEMPLATES: {
  id: LifeGoalCategory
  label: string
  example: string
}[] = [
  { id: 'finance', label: 'Gastos', example: 'Gastar menos em delivery esta semana' },
  { id: 'sleep', label: 'Sono', example: 'Dormir pelo menos 7h por noite' },
  { id: 'mental', label: 'Saúde mental', example: 'Fazer check-in de humor 5 dias' },
  { id: 'task', label: 'Tarefa', example: 'Terminar o relatório do trabalho' },
  { id: 'health', label: 'Saúde', example: 'Beber 8 copos de água por dia' },
  { id: 'custom', label: 'Personalizada', example: 'O que importa para você agora' },
]

function startOfWeekIso(ref: Date): string
{
  const d = new Date(ref)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(12, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

/** Semanal: renova a cada semana (domingo). Mensal: renova no mês seguinte. */
export function lifeGoalNeedsRefresh(goal: LifeGoal | null | undefined, ref = new Date()): boolean
{
  if (!goal?.title?.trim()) return true
  if (goal.cadence === 'month')
  {
    return goal.periodStart.slice(0, 7) !== ref.toISOString().slice(0, 7)
  }
  return startOfWeekIso(new Date(`${goal.periodStart}T12:00:00`))
    !== startOfWeekIso(ref)
}

export function lifeGoalMicroLabel(goal: LifeGoal | null | undefined, ref = new Date()): string
{
  if (!goal?.title?.trim() || lifeGoalNeedsRefresh(goal, ref))
  {
    return 'Defina sua meta'
  }
  const cadence = goal.cadence === 'week' ? 'semana' : 'mês'
  const short = goal.title.trim().length > 28
    ? `${goal.title.trim().slice(0, 28)}…`
    : goal.title.trim()
  return `Meta ${cadence}: ${short}`
}
