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

/** Sem rotina pré-definida: o usuário cria hábitos e grupos no app. */
export function defaultRoutines(): RoutineHabit[]
{
  return []
}

/** Hábito de rotina ligado à hidratação (ex.: "Beber água" do seed antigo). */
export function isWaterRoutineHabit(habit: RoutineHabit): boolean
{
  const t = habit.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  return /\bagua\b/.test(t) || t.includes('hidrat') || t.includes('water')
}

/** Corrige hábitos legados com meta diária alta que confundiam o check da rotina. */
export function normalizeLegacyRoutines(items: RoutineHabit[]): RoutineHabit[]
{
  return items.map((h) =>
  {
    if (isWaterRoutineHabit(h) && h.dailyTarget > 1)
    {
      return { ...h, dailyTarget: 1 }
    }
    return h
  })
}

export type WaterRoutineGate = {
  locked: boolean
  progressLabel: string
}

/** Rotina de água só libera o check quando a meta de copos em Saúde for atingida. */
export function waterRoutineGate(cupsDone: number, cupsGoal: number): WaterRoutineGate
{
  const goal = Math.max(1, cupsGoal)
  const done = Math.max(0, cupsDone)
  return {
    locked: done < goal,
    progressLabel: `${done}/${goal} copos`,
  }
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

export type RoutineLeafSummary = {
  id: string
  title: string
  parentTitle: string | null
  cadence: RoutineCadence
  streak: number
  weekHits: number
  weekTarget: number
  pct: number
}

export function routineLeafSummaries(
  items: RoutineHabit[],
  logs: RoutineLogs,
  weekOffset = 0,
  ref = new Date(),
): RoutineLeafSummary[]
{
  const anchor = new Date(ref)
  anchor.setDate(anchor.getDate() + weekOffset * 7)
  const leaves = routineLeaves(items)
  return leaves.map((h) =>
  {
    const hits = weekHits(h, logs, anchor)
    const target = h.cadence === 'weekly' ? h.weeklyTarget : 7
    const parent = items.find((p) => p.id === h.parentId)
    return {
      id: h.id,
      title: h.title,
      parentTitle: parent?.title ?? null,
      cadence: h.cadence,
      streak: winStreak(h, logs, ref, items),
      weekHits: hits,
      weekTarget: target,
      pct: Math.round((hits / Math.max(1, target)) * 100),
    }
  })
}

export function routineWeekCompletionPct(summaries: RoutineLeafSummary[]): number
{
  if (summaries.length === 0) return 0
  const total = summaries.reduce((a, s) => a + Math.min(100, s.pct), 0)
  return Math.round(total / summaries.length)
}

export function routineWeekTitle(weekOffset = 0, ref = new Date()): string
{
  const anchor = new Date(ref)
  anchor.setDate(anchor.getDate() + weekOffset * 7)
  const monday = mondayOfLocalWeek(anchor)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const sameMonth = monday.getMonth() === sunday.getMonth() && monday.getFullYear() === sunday.getFullYear()
  if (sameMonth)
  {
    return monday.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }
  const start = monday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
  const end = sunday.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${start} a ${end}`
}

export function buildRoutineWeek(
  items: RoutineHabit[],
  logs: RoutineLogs,
  ref = new Date(),
  weekOffset = 0,
): RoutineWeekCell[]
{
  const leaves = routineLeaves(items)
  const today = localTodayIso(ref)
  const anchor = new Date(ref)
  anchor.setDate(anchor.getDate() + weekOffset * 7)
  const monday = mondayOfLocalWeek(anchor)
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

export const HABIT_ACCENTS = ['#E8734A', '#7BC9A0', '#5B8DEF', '#C4A574', '#E07A6A'] as const

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
