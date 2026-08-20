// Regras da ofensiva diária — uma ação qualifica o dia

export interface OffensiveChecklist
{
  taskDone: boolean
  wellbeingDone: boolean
  safe: boolean
  streakCount: number
}

export function buildOffensiveChecklist(
  hasCompletedTaskToday: boolean,
  hasWellbeingToday: boolean,
  streakCount: number,
  hasDayCheckinToday = false,
): OffensiveChecklist
{
  const safe = hasCompletedTaskToday || hasWellbeingToday || hasDayCheckinToday
  return {
    taskDone: hasCompletedTaskToday,
    wellbeingDone: hasWellbeingToday,
    safe,
    streakCount,
  }
}

export const OFFENSIVE_RULES = [
  'Concluir 1 tarefa no Kanban (com checklist ou prova de trabalho)',
  'Registrar humor ou completar 80% do ritual de saúde',
] as const
