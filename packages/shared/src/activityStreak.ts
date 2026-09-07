import { isoDaysAgo, localIsoDaysAgo, localTodayIso, mondayOfLocalWeek, todayIso } from './dates'

export function uniqueIsoDates(values: Array<string | undefined | null>): string[]
{
  const set = new Set<string>()
  for (const v of values)
  {
    if (!v) continue
    const iso = v.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso))
    {
      set.add(iso)
    }
  }
  return [...set].sort()
}

export function consecutiveActivity(
  isoDates: string[],
  ref = new Date(),
  windowDays = 30,
): { current: number; record: number; weekLogged: number }
{
  const set = new Set(isoDates)
  const today = todayIso(ref)
  let cursor = today
  if (!set.has(cursor))
  {
    cursor = isoDaysAgo(1, ref)
  }

  let current = 0
  while (set.has(cursor))
  {
    current += 1
    const d = new Date(`${cursor}T12:00:00`)
    d.setDate(d.getDate() - 1)
    cursor = d.toISOString().slice(0, 10)
  }

  let record = 0
  let run = 0
  for (let i = windowDays - 1; i >= 0; i -= 1)
  {
    const iso = isoDaysAgo(i, ref)
    if (set.has(iso))
    {
      run += 1
      if (run > record)
      {
        record = run
      }
    }
    else
    {
      run = 0
    }
  }

  let weekLogged = 0
  for (let i = 0; i < 7; i += 1)
  {
    if (set.has(isoDaysAgo(i, ref)))
    {
      weekLogged += 1
    }
  }

  return { current, record: Math.max(record, current), weekLogged }
}

export function streakPhrase(current: number, weekLogged: number): string
{
  if (current <= 0)
  {
    return 'Ainda sem sequência. Um registro hoje já começa o ritmo.'
  }
  if (weekLogged >= 7)
  {
    return `Você manteve o ritmo por ${current} dias. Semana completa de registros.`
  }
  if (current === 1)
  {
    return 'Primeiro dia. Um registro por dia essa semana.'
  }
  return `Você manteve o ritmo por ${current} dias. Um registro por dia essa semana.`
}

export const STREAK_MILESTONES = [3, 5, 7, 14, 21, 30, 60, 100] as const

export type StreakDayKind = 'action' | 'open' | 'missed' | 'future' | 'today'

export type StreakWeekCell = {
  iso: string
  label: string
  dayNum: number
  kind: StreakDayKind
}

export type StreakMonthCell = {
  iso: string
  dayNum: number
  inMonth: boolean
  kind: StreakDayKind
}

const WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function nextStreakMilestone(current: number): number | null
{
  for (const m of STREAK_MILESTONES)
  {
    if (current < m) return m
  }
  return null
}

export function consecutiveLocalActivity(
  isoDates: string[],
  ref = new Date(),
  windowDays = 90,
): { current: number; record: number; weekLogged: number }
{
  const set = new Set(isoDates)
  const today = localTodayIso(ref)
  let cursor = today
  if (!set.has(cursor))
  {
    cursor = localIsoDaysAgo(1, ref)
  }

  let current = 0
  while (set.has(cursor))
  {
    current += 1
    const d = new Date(`${cursor}T12:00:00`)
    d.setDate(d.getDate() - 1)
    cursor = localTodayIso(d)
  }

  let record = 0
  let run = 0
  for (let i = windowDays - 1; i >= 0; i -= 1)
  {
    const iso = localIsoDaysAgo(i, ref)
    if (set.has(iso))
    {
      run += 1
      if (run > record) record = run
    }
    else
    {
      run = 0
    }
  }

  let weekLogged = 0
  for (let i = 0; i < 7; i += 1)
  {
    if (set.has(localIsoDaysAgo(i, ref))) weekLogged += 1
  }

  return { current, record: Math.max(record, current), weekLogged }
}

function kindForIso(
  iso: string,
  action: Set<string>,
  open: Set<string>,
  today: string,
): StreakDayKind
{
  if (iso > today) return 'future'
  if (action.has(iso)) return 'action'
  if (iso === today) return open.has(iso) ? 'open' : 'today'
  if (open.has(iso)) return 'open'
  return 'missed'
}

/** Semana atual (seg–dom) com fogo / falta / em andamento. */
export function buildStreakWeek(
  actionDates: string[],
  openDates: string[],
  ref = new Date(),
): StreakWeekCell[]
{
  const action = new Set(actionDates)
  const open = new Set(openDates)
  const today = localTodayIso(ref)
  const monday = mondayOfLocalWeek(ref)
  return WEEK_LABELS.map((label, i) =>
  {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = localTodayIso(d)
    return {
      iso,
      label,
      dayNum: d.getDate(),
      kind: kindForIso(iso, action, open, today),
    }
  })
}

/** Grade do mês alinhada à segunda-feira. */
export function buildStreakMonth(
  year: number,
  monthIndex: number,
  actionDates: string[],
  openDates: string[],
  ref = new Date(),
): StreakMonthCell[]
{
  const action = new Set(actionDates)
  const open = new Set(openDates)
  const today = localTodayIso(ref)
  const first = new Date(year, monthIndex, 1)
  const monday = mondayOfLocalWeek(first)
  const cells: StreakMonthCell[] = []
  for (let i = 0; i < 42; i += 1)
  {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = localTodayIso(d)
    cells.push({
      iso,
      dayNum: d.getDate(),
      inMonth: d.getMonth() === monthIndex,
      kind: kindForIso(iso, action, open, today),
    })
  }
  return cells
}
