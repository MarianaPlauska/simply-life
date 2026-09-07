import { localIsoDaysAgo, localTodayIso, mondayOfLocalWeek } from './dates'

export type RoutineCadence = 'daily' | 'weekly'

export type RoutineHabit = {
  id: string
  title: string
  parentId: string | null
  isGroup: boolean
  cadence: RoutineCadence
  dailyTarget: number
  weeklyTarget: number
}

export type RoutineLogs = Record<string, Record<string, number>>

export const ROUTINE_WEEK_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function defaultRoutines(): RoutineHabit[]
{
  return [
    {
      id: 'r-bem-estar',
      title: 'Rotina de bem-estar',
      parentId: null,
      isGroup: true,
      cadence: 'daily',
      dailyTarget: 1,
      weeklyTarget: 7,
    },
    {
      id: 'r-acordar',
      title: 'Acordar cedo',
      parentId: 'r-bem-estar',
      isGroup: false,
      cadence: 'daily',
      dailyTarget: 1,
      weeklyTarget: 7,
    },
    {
      id: 'r-agua',
      title: 'Beber água',
      parentId: 'r-bem-estar',
      isGroup: false,
      cadence: 'daily',
      dailyTarget: 5,
      weeklyTarget: 7,
    },
    {
      id: 'r-meditar',
      title: 'Meditar',
      parentId: 'r-bem-estar',
      isGroup: false,
      cadence: 'weekly',
      dailyTarget: 1,
      weeklyTarget: 3,
    },
  ]
}

export function routineLeaves(items: RoutineHabit[]): RoutineHabit[]
{
  return items.filter((h) => !h.isGroup)
}

export function childrenOf(items: RoutineHabit[], parentId: string): RoutineHabit[]
{
  return items.filter((h) => h.parentId === parentId)
}

export function dayCount(logs: RoutineLogs, id: string, iso: string): number
{
  return logs[id]?.[iso] ?? 0
}

export function habitMetOn(
  habit: RoutineHabit,
  logs: RoutineLogs,
  iso: string,
): boolean
{
  if (habit.isGroup) return false
  const n = dayCount(logs, habit.id, iso)
  if (habit.cadence === 'weekly') return n >= 1
  return n >= Math.max(1, habit.dailyTarget)
}

export function winStreak(
  habit: RoutineHabit,
  logs: RoutineLogs,
  ref = new Date(),
  items: RoutineHabit[] = [],
): number
{
  const today = localTodayIso(ref)
  let cursor = metOnDay(habit, logs, today, items)
    ? today
    : localIsoDaysAgo(1, ref)
  let n = 0
  while (metOnDay(habit, logs, cursor, items))
  {
    n += 1
    const d = new Date(`${cursor}T12:00:00`)
    d.setDate(d.getDate() - 1)
    cursor = localTodayIso(d)
  }
  return n
}

export function missStreak(
  habit: RoutineHabit,
  logs: RoutineLogs,
  ref = new Date(),
): number
{
  if (habit.cadence === 'weekly') return 0
  const hasHistory = Object.values(logs[habit.id] ?? {}).some((n) => n > 0)
  if (!hasHistory) return 0
  const today = localTodayIso(ref)
  if (habitMetOn(habit, logs, today)) return 0
  let n = 0
  let cursor = today
  for (let i = 0; i < 30; i += 1)
  {
    if (habitMetOn(habit, logs, cursor)) break
    if (cursor > today) break
    n += 1
    const d = new Date(`${cursor}T12:00:00`)
    d.setDate(d.getDate() - 1)
    cursor = localTodayIso(d)
  }
  return n
}

export function weekHits(
  habit: RoutineHabit,
  logs: RoutineLogs,
  ref = new Date(),
): number
{
  const monday = mondayOfLocalWeek(ref)
  let n = 0
  for (let i = 0; i < 7; i += 1)
  {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    if (habitMetOn(habit, logs, localTodayIso(d))) n += 1
  }
  return n
}

export function streakLine(
  habit: RoutineHabit,
  logs: RoutineLogs,
  ref = new Date(),
): { text: string; tone: 'good' | 'bad' | 'neutral' }
{
  if (habit.cadence === 'weekly')
  {
    const hits = weekHits(habit, logs, ref)
    const left = Math.max(0, habit.weeklyTarget - hits)
    if (left === 0)
    {
      return { text: `${hits} nesta semana. Meta fechada.`, tone: 'good' }
    }
    return {
      text: `${hits} nesta semana. Falta${left === 1 ? '' : 'm'} ${left}.`,
      tone: hits > 0 ? 'good' : 'neutral',
    }
  }
  const miss = missStreak(habit, logs, ref)
  if (miss >= 2 && !habitMetOn(habit, logs, localTodayIso(ref)))
  {
    return { text: `${miss} em falta. Toque para um empurrão.`, tone: 'bad' }
  }
  const win = winStreak(habit, logs, ref)
  if (win >= 7) return { text: `${win} seguidos. Muito bem!`, tone: 'good' }
  if (win >= 3) return { text: `${win} seguidos. Segue assim.`, tone: 'good' }
  if (win >= 1) return { text: `${win} seguidos. Continua.`, tone: 'good' }
  return { text: 'Começa hoje — um check já vale.', tone: 'neutral' }
}

export type RoutineWeekCell = {
  iso: string
  label: string
  dayNum: number
  done: number
  miss: number
  tone: 'good' | 'bad' | 'future' | 'today' | 'idle'
}

export function buildRoutineWeek(
  items: RoutineHabit[],
  logs: RoutineLogs,
  ref = new Date(),
): RoutineWeekCell[]
{
  const leaves = routineLeaves(items)
  const today = localTodayIso(ref)
  const monday = mondayOfLocalWeek(ref)
  return ROUTINE_WEEK_LABELS.map((label, i) =>
  {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const iso = localTodayIso(d)
    let done = 0
    let miss = 0
    for (const h of leaves)
    {
      if (habitMetOn(h, logs, iso)) done += 1
      else if (iso < today && h.cadence === 'daily') miss += 1
    }
    let tone: RoutineWeekCell['tone'] = 'idle'
    if (iso > today) tone = 'future'
    else if (iso === today) tone = 'today'
    else if (miss > 0) tone = 'bad'
    else if (done > 0) tone = 'good'
    return { iso, label, dayNum: d.getDate(), done, miss, tone }
  })
}

export function groupCompleteToday(
  items: RoutineHabit[],
  logs: RoutineLogs,
  parentId: string,
  iso: string,
): boolean
{
  const kids = childrenOf(items, parentId)
  if (kids.length === 0) return false
  return kids.every((h) => habitMetOn(h, logs, iso))
}

function metOnDay(
  habit: RoutineHabit,
  logs: RoutineLogs,
  iso: string,
  items: RoutineHabit[] = [],
): boolean
{
  if (habit.isGroup) return groupCompleteToday(items, logs, habit.id, iso)
  return habitMetOn(habit, logs, iso)
}

export const ROUTINE_ADVICE = [
  'Não precisa recuperar o dia inteiro. Um check agora já corta a sequência de falta.',
  'Encolhe o hábito: metade do alvo ainda conta. O fogo volta amanhã.',
  'Emparelha com algo que você já faz — depois do café, depois do banho.',
]

export const HABIT_ACCENTS = ['#5B8DEF', '#3DBE8B', '#8B7CF6', '#E8734A', '#E07A6A'] as const

export function habitAccent(id: string): string
{
  let h = 0
  for (let i = 0; i < id.length; i += 1)
  {
    h = (h * 31 + id.charCodeAt(i)) >>> 0
  }
  return HABIT_ACCENTS[h % HABIT_ACCENTS.length]
}

export type HeatCell = {
  iso: string
  filled: boolean
  future: boolean
}

/** Últimos N dias para o quadriculado tipo GitHub. */
export function habitHeatmap(
  habit: RoutineHabit,
  logs: RoutineLogs,
  days = 84,
  ref = new Date(),
  items: RoutineHabit[] = [],
): HeatCell[]
{
  const today = localTodayIso(ref)
  const cells: HeatCell[] = []
  for (let i = days - 1; i >= 0; i -= 1)
  {
    const iso = localIsoDaysAgo(i, ref)
    const filled =
      iso <= today &&
      (habit.isGroup
        ? groupCompleteToday(items, logs, habit.id, iso)
        : habitMetOn(habit, logs, iso))
    cells.push({ iso, filled, future: iso > today })
  }
  return cells
}
