// Congelamento de ofensiva no fim de semana — dias úteis contam para quebra

export function isWeekend(date: Date = new Date()): boolean
{
  const dow = date.getDay()
  return dow === 0 || dow === 6
}

/** Fim de semana sem prova de trabalho — ofensiva não quebra */
export function isWeekendStreakFrozen(): boolean
{
  return isWeekend()
}

export const WEEKEND_STREAK_TOOLTIP = 'Descanso de Fim de Semana Ativo'

/** Dias úteis entre last (exclusivo) e today (exclusivo) */
export function countAccountableMissedDays(lastIso: string, todayIso: string): number
{
  if (lastIso >= todayIso) return 0

  let count = 0
  const cur = new Date(`${lastIso}T12:00:00`)
  const end = new Date(`${todayIso}T12:00:00`)
  cur.setDate(cur.getDate() + 1)

  while (cur < end)
  {
    const dow = cur.getDay()
    if (dow !== 0 && dow !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }

  return count
}
