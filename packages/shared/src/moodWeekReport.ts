import type { HumorRegistro } from './mood'
import { buildMoodDistribution, isDemoHumorRow, moodLabel } from './mood'
import type { LifeGoal } from './lifeGoals'
import { lifeGoalNeedsRefresh } from './lifeGoals'

export type MoodAlertLevel = 'none' | 'watch' | 'concern'

export type MoodGoalPeriodStats = {
  total: number
  terribleCount: number
  terriblePct: number
  byDay: number[]
  alertLevel: MoodAlertLevel
}

export type MoodRecurringTheme = {
  theme: string
  count: number
}

export type MoodWeekReport = {
  weekStart: string
  weekEnd: string
  totalEntries: number
  daysLogged: number
  topMoods: { mood: number; label: string; count: number; pct: number }[]
  recurringThemes: MoodRecurringTheme[]
  terribleCount: number
  terriblePct: number
  alertLevel: MoodAlertLevel
}

function isoDate(d: Date): string
{
  return d.toISOString().slice(0, 10)
}

/** Domingo da semana de ref (início domingo). */
export function startOfWeekSundayIso(ref = new Date()): string
{
  const d = new Date(ref)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(12, 0, 0, 0)
  return isoDate(d)
}

/** Semana fechada anterior (domingo a sábado) — relatório de domingo. */
export function previousWeekRange(ref = new Date()): { start: string; end: string }
{
  const d = new Date(ref)
  d.setHours(12, 0, 0, 0)
  const end = new Date(d)
  end.setDate(end.getDate() - d.getDay() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  return { start: isoDate(start), end: isoDate(end) }
}

function normalizeNote(raw: string): string
{
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function noteTokens(raw: string): Set<string>
{
  const stop = new Set([
    'que', 'com', 'para', 'uma', 'um', 'de', 'da', 'do', 'em', 'no', 'na',
    'eu', 'me', 'muito', 'bem', 'dia', 'hoje', 'foi', 'esta', 'estou',
  ])
  return new Set(
    normalizeNote(raw)
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stop.has(w)),
  )
}

function noteSimilarity(a: string, b: string): number
{
  const ta = noteTokens(a)
  const tb = noteTokens(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta)
  {
    if (tb.has(t)) inter++
  }
  const union = new Set([...ta, ...tb]).size
  return union ? inter / union : 0
}

/** Agrupa notas parecidas (heurística local — sem IA). */
export function clusterMoodNotes(rows: HumorRegistro[]): MoodRecurringTheme[]
{
  const notes = rows
    .map((r) => r.nota?.trim())
    .filter((n): n is string => Boolean(n))

  const clusters: { rep: string; count: number }[] = []
  for (const note of notes)
  {
    let matched = false
    for (const c of clusters)
    {
      if (noteSimilarity(note, c.rep) >= 0.42)
      {
        c.count++
        matched = true
        break
      }
    }
    if (!matched)
    {
      clusters.push({ rep: note, count: 1 })
    }
  }

  return clusters
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((c) => ({
      theme: c.rep.length > 52 ? `${c.rep.slice(0, 52)}…` : c.rep,
      count: c.count,
    }))
}

function filterHumorRange(
  rows: HumorRegistro[],
  startIso: string,
  endIso: string,
): HumorRegistro[]
{
  return rows.filter((r) =>
  {
    if (isDemoHumorRow(r)) return false
    const d = (r.data || '').slice(0, 10)
    return d >= startIso && d <= endIso
  })
}

function alertFromTerrible(total: number, terribleCount: number): MoodAlertLevel
{
  if (total === 0) return 'none'
  const pct = (terribleCount / total) * 100
  if (terribleCount >= 3 || pct >= 40) return 'concern'
  if (terribleCount >= 2 || pct >= 25) return 'watch'
  return 'none'
}

/** Humor no período da meta ativa — alerta se muitos “Péssimo”. */
export function moodGoalPeriodStats(
  rows: HumorRegistro[],
  goal: LifeGoal | null | undefined,
  ref = new Date(),
): MoodGoalPeriodStats | null
{
  if (!goal?.title?.trim() || lifeGoalNeedsRefresh(goal, ref)) return null

  const end = isoDate(ref)
  const inPeriod = filterHumorRange(rows, goal.periodStart, end)
  if (inPeriod.length === 0) return null

  const terrible = inPeriod.filter((r) => Math.round(r.humor) === 1)
  const terriblePct = Math.round((terrible.length / inPeriod.length) * 100)

  const byDay: number[] = []
  const cursor = new Date(`${goal.periodStart}T12:00:00`)
  const endD = new Date(`${end}T12:00:00`)
  while (cursor <= endD && byDay.length < 14)
  {
    const key = isoDate(cursor)
    const dayRows = inPeriod.filter((r) => (r.data || '').slice(0, 10) === key)
    byDay.push(dayRows.filter((r) => Math.round(r.humor) === 1).length)
    cursor.setDate(cursor.getDate() + 1)
  }

  return {
    total: inPeriod.length,
    terribleCount: terrible.length,
    terriblePct,
    byDay,
    alertLevel: alertFromTerrible(inPeriod.length, terrible.length),
  }
}

/** Relatório semanal (semana dom–sáb anterior). */
export function buildMoodWeekReport(
  rows: HumorRegistro[],
  ref = new Date(),
): MoodWeekReport | null
{
  const { start, end } = previousWeekRange(ref)
  const weekRows = filterHumorRange(rows, start, end)
  if (weekRows.length === 0) return null

  const dist = buildMoodDistribution(weekRows)
  const total = dist.reduce((s, d) => s + d.value, 0)
  const topMoods = [...dist]
    .sort((a, b) => b.value - a.value)
    .slice(0, 2)
    .map((d) => ({
      mood: d.mood,
      label: moodLabel(d.mood),
      count: d.value,
      pct: total ? Math.round((d.value / total) * 100) : 0,
    }))

  const terribleCount = weekRows.filter((r) => Math.round(r.humor) === 1).length
  const daysLogged = new Set(weekRows.map((r) => (r.data || '').slice(0, 10))).size

  return {
    weekStart: start,
    weekEnd: end,
    totalEntries: weekRows.length,
    daysLogged,
    topMoods,
    recurringThemes: clusterMoodNotes(weekRows),
    terribleCount,
    terriblePct: Math.round((terribleCount / weekRows.length) * 100),
    alertLevel: alertFromTerrible(weekRows.length, terribleCount),
  }
}

/** Mostrar relatório aos domingos (semana anterior ainda não dispensada). */
export function shouldShowMoodWeekReport(
  ref = new Date(),
  dismissedWeekStart?: string | null,
): boolean
{
  if (ref.getDay() !== 0) return false
  const { start } = previousWeekRange(ref)
  return dismissedWeekStart !== start
}
