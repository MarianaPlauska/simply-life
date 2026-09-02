import { MOOD_COLORS, MOOD_LABELS, MOOD_EMOJI } from '@simply-life/ui-tokens'

export interface HumorRegistro
{
  id: number
  data: string
  humor: number
  nota?: string | null
  created_at?: string
}

export interface DiaHumorAgregado
{
  data: string
  humor: number
  registros: number
}

export interface MoodDistributionSlice
{
  name: string
  value: number
  color: string
  mood: number
}

export interface MoodCalendarCell
{
  date: string
  humor: number | null
  inMonth: boolean
}

export function moodLabel(value: number): string
{
  return MOOD_LABELS[Math.round(value)] ?? '—'
}

export function moodColor(value: number): string
{
  return MOOD_COLORS[Math.round(value)] ?? MOOD_COLORS[3]
}

export function moodEmoji(value: number): string
{
  return MOOD_EMOJI[Math.round(value)] ?? '😐'
}

export function aggregateHumorByDay(rows: HumorRegistro[]): DiaHumorAgregado[]
{
  const map = new Map<string, { sum: number; n: number }>()
  for (const r of rows)
  {
    const prev = map.get(r.data) ?? { sum: 0, n: 0 }
    map.set(r.data, { sum: prev.sum + r.humor, n: prev.n + 1 })
  }
  return [...map.entries()]
    .map(([data, { sum, n }]) => ({
      data,
      humor: Math.round(sum / n),
      registros: n,
    }))
    .sort((a, b) => a.data.localeCompare(b.data))
}

export function buildMoodDistribution(registros: HumorRegistro[]): MoodDistributionSlice[]
{
  const counts = new Map<number, number>()
  for (const r of registros)
  {
    const v = Math.round(r.humor)
    if (v < 1 || v > 5) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }

  return ([1, 2, 3, 4, 5] as const)
    .map((mood) => ({
      name: MOOD_LABELS[mood],
      value: counts.get(mood) ?? 0,
      color: MOOD_COLORS[mood],
      mood,
    }))
    .filter((s) => s.value > 0)
}

function dayKey(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function weekdayLabels(): string[]
{
  return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
}

export function buildCurrentMonthCalendar(
  agregados: DiaHumorAgregado[],
  reference = new Date(),
): MoodCalendarCell[]
{
  const map = new Map(agregados.map((d) => [d.data, d.humor]))
  const year = reference.getFullYear()
  const month = reference.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const endPad = (7 - ((last.getDay() + 6) % 7 + 1)) % 7
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - startPad)
  const totalCells = startPad + last.getDate() + endPad
  const cells: MoodCalendarCell[] = []

  for (let i = 0; i < totalCells; i++)
  {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const key = dayKey(d)
    const inMonth = d.getMonth() === month
    const humor = inMonth && map.has(key) ? Math.round(map.get(key)!) : null
    cells.push({ date: key, humor, inMonth })
  }

  return cells
}
