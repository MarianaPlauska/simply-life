import type { DiaHumorAgregado } from './moodInsights'
import type { TarefaUnificada } from '../types'

export interface WeekChartPoint
{
  iso: string
  label: string
  humor: number | null
  tarefas: number
}

/** Últimos 7 dias (ISO) */
export function last7IsoDates(): string[]
{
  const out: string[] = []
  for (let i = 6; i >= 0; i--)
  {
    const d = new Date()
    d.setDate(d.getDate() - i)
    out.push(d.toISOString().slice(0, 10))
  }
  return out
}

function shortWeekday(iso: string): string
{
  return new Date(`${iso}T12:00:00`)
    .toLocaleDateString('pt-BR', { weekday: 'short' })
    .replace('.', '')
}

/** Série semanal - humor e tarefas para gráficos do dashboard */
export function buildWeekPerformanceSeries(
  humorDias: DiaHumorAgregado[],
  tarefas: TarefaUnificada[],
): WeekChartPoint[]
{
  const humorByDate = new Map(humorDias.map((d) => [d.data, d.humor]))

  return last7IsoDates().map((iso) =>
  {
    const concluidas = tarefas.filter((t) =>
    {
      if (t.status !== 'concluida')
      {
        return false
      }
      const ref = (t.data_vencimento || t.created_at || '').slice(0, 10)
      return ref === iso
    }).length

    return {
      iso,
      label: shortWeekday(iso),
      humor: humorByDate.has(iso) ? humorByDate.get(iso)! : null,
      tarefas: concluidas,
    }
  })
}
