import type { HumorRegistro } from '../store/slices/bemEstarSlice'
import { MOODS } from './moodConstants'
import type { DiaHumorAgregado } from './moodInsights'

export interface MoodDistributionSlice
{
  name: string
  value: number
  color: string
  mood: number
}

/** Contagem por categoria de humor (1-5) no período */
export function buildMoodDistribution(registros: HumorRegistro[]): MoodDistributionSlice[]
{
  const counts = new Map<number, number>()
  for (const r of registros)
  {
    const v = Math.round(r.humor)
    if (v < 1 || v > 5) continue
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }

  return MOODS
    .map((m) => ({
      name: m.label,
      value: counts.get(m.value) ?? 0,
      color: m.hex,
      mood: m.value,
    }))
    .filter((s) => s.value > 0)
}

export interface MoodCalendarCell
{
  date: string
  humor: number | null
  inMonth: boolean
}

const WEEKDAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

export function weekdayLabels(): string[]
{
  return WEEKDAY_LABELS
}

function dayKey(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Grade do mês corrente - semanas × dias da semana (segunda primeiro) */
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

export function currentMonthLabel(reference = new Date()): string
{
  return reference.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
