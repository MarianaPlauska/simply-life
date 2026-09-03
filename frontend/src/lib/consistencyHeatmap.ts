/** Grade tipo GitHub - consistência por dia (execução ou gasto) */

export type ConsistencyTone = 'health' | 'finance'

export interface ConsistencyDay
{
  date: string
  count: number
  value: number
}

export function localIsoDate(d = new Date()): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function bump(
  map: Record<string, ConsistencyDay>,
  date: string,
  count: number,
  value: number,
): void
{
  if (!date || date.length < 10)
  {
    return
  }
  const key = date.slice(0, 10)
  const prev = map[key] ?? { date: key, count: 0, value: 0 }
  map[key] = {
    date: key,
    count: prev.count + count,
    value: prev.value + value,
  }
}

/** Segunda = 0 … domingo = 6 (semana local BR) */
export function weekdayIndexMon(d: Date): number
{
  return (d.getDay() + 6) % 7
}

/** Células das últimas `weeks` semanas, alinhadas à segunda, até hoje (local) */
export function buildConsistencyCells(
  byDate: Record<string, ConsistencyDay>,
  weeks = 12,
  end = new Date(),
): ConsistencyDay[]
{
  const cursor = new Date(end)
  cursor.setHours(12, 0, 0, 0)
  const start = new Date(cursor)
  start.setDate(start.getDate() - (weeks * 7 - 1))
  start.setDate(start.getDate() - weekdayIndexMon(start))

  const cells: ConsistencyDay[] = []
  const d = new Date(start)
  while (d <= cursor)
  {
    const iso = localIsoDate(d)
    const hit = byDate[iso]
    cells.push(hit ?? { date: iso, count: 0, value: 0 })
    d.setDate(d.getDate() + 1)
  }

  return cells
}

export function intensity01(count: number, maxCount: number): number
{
  if (maxCount <= 0 || count <= 0)
  {
    return 0
  }
  return Math.min(1, count / maxCount)
}

/** Escala discreta 0-4 (Rise / GitHub) */
export function intensityLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4
{
  if (count <= 0 || maxCount <= 0)
  {
    return 0
  }
  const t = count / maxCount
  if (t <= 0.25) return 1
  if (t <= 0.5) return 2
  if (t <= 0.75) return 3
  return 4
}

export const INTENSITY_MIX = [0, 28, 48, 70, 90] as const

/** Foco do dia + conclusões recentes → mapa de execução */
export function buildExecutionDayMap(
  focusMinutesByDate: Record<string, number>,
  completedAtIsos: string[],
): Record<string, ConsistencyDay>
{
  const map: Record<string, ConsistencyDay> = {}

  for (const [date, minutes] of Object.entries(focusMinutesByDate))
  {
    const mins = Math.max(0, Math.round(minutes))
    if (mins <= 0)
    {
      continue
    }
    bump(map, date, 0, mins)
  }

  for (const iso of completedAtIsos)
  {
    bump(map, iso, 1, 0)
  }

  for (const day of Object.values(map))
  {
    if (day.count === 0 && day.value > 0)
    {
      day.count = Math.max(1, Math.ceil(day.value / 25))
    }
  }

  return map
}

export function buildSpendDayMap(
  items: Array<{ data: string; tipo: string; valor: number }>,
): Record<string, ConsistencyDay>
{
  const map: Record<string, ConsistencyDay> = {}
  for (const t of items)
  {
    if (t.tipo !== 'despesa' || t.valor <= 0)
    {
      continue
    }
    bump(map, t.data, 1, t.valor)
  }
  return map
}

export function formatExecutionTooltip(day: ConsistencyDay): string
{
  if (day.count <= 0)
  {
    return `${day.date} · sem execução`
  }
  const mins = Math.round(day.value)
  const sessions = mins > 0 ? Math.max(1, Math.ceil(mins / 25)) : 0
  if (mins > 0 && day.count === sessions)
  {
    return `${day.date} · ${day.count} sessão(ões) de foco`
  }
  const n = day.count
  return `${day.date} · ${n} concluída${n === 1 ? '' : 's'}`
}

export function formatSpendTooltip(day: ConsistencyDay): string
{
  if (day.count <= 0)
  {
    return `${day.date} · sem gasto`
  }
  const brl = day.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `${day.date} · ${brl} · ${day.count} lançamento(s)`
}
