/** Calcula sequência atual e recorde a partir de datas concluídas (YYYY-MM-DD) */

function parseDay(key: string): Date
{
  return new Date(`${key.slice(0, 10)}T12:00:00`)
}

function dayKey(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(d: Date, delta: number): Date
{
  const next = new Date(d)
  next.setDate(next.getDate() + delta)
  return next
}

export interface HabitStreakStats
{
  streak_dias: number
  recorde_dias: number
  ultima_data: string | null
}

export function computeStreakStats(
  completedDates: string[],
  ref = new Date(),
): HabitStreakStats
{
  const unique = [...new Set(completedDates.map((d) => d.slice(0, 10)))].sort()
  if (unique.length === 0)
  {
    return { streak_dias: 0, recorde_dias: 0, ultima_data: null }
  }

  const set = new Set(unique)
  const ultima_data = unique[unique.length - 1]

  let recorde_dias = 1
  let run = 1
  for (let i = 1; i < unique.length; i++)
  {
    const prev = parseDay(unique[i - 1])
    const curr = parseDay(unique[i])
    const gap = Math.round((curr.getTime() - prev.getTime()) / 86_400_000)
    if (gap === 1)
    {
      run++
      recorde_dias = Math.max(recorde_dias, run)
    }
    else
    {
      run = 1
    }
  }

  const todayKey = dayKey(ref)
  let cursorKey = todayKey
  if (!set.has(todayKey))
  {
    const yesterday = dayKey(addDays(ref, -1))
    if (!set.has(yesterday))
    {
      return { streak_dias: 0, recorde_dias, ultima_data }
    }
    cursorKey = yesterday
  }

  let streak_dias = 0
  let cursor = parseDay(cursorKey)
  while (set.has(dayKey(cursor)))
  {
    streak_dias++
    cursor = addDays(cursor, -1)
  }

  return { streak_dias, recorde_dias, ultima_data }
}
