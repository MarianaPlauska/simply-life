// Analytics de academia — séries, PRs, heatmap e consistência

import type { AnalyticsChartRow, AnalyticsTimeframe } from '../data/analyticsMockData'
import type { SessaoTreino } from '../store/storeTypes'

export interface AcademyPR
{
  exercicio: string
  exercicio_id: string
  carga_kg: number
  data: string
}

export interface AcademyHeatmapDay
{
  date: string
  count: number
  volume: number
}

export interface AcademyLoadTrendPoint
{
  data: string
  label: string
  peso_kg: number
  reps: number
}

export function timeframeDays(tf: AnalyticsTimeframe): number
{
  if (tf === '1W')
  {
    return 7
  }
  if (tf === '1M')
  {
    return 30
  }
  return 180
}

function diaFromSessao(s: SessaoTreino): string
{
  return (s.finalizado_em ?? s.iniciado_em).slice(0, 10)
}

function sessaoFinalizada(s: SessaoTreino): boolean
{
  return Boolean(s.finalizado_em)
}

export function filterSessoesByDays(
  sessoes: SessaoTreino[],
  days: number,
  refDate = new Date(),
): SessaoTreino[]
{
  const start = new Date(refDate)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - days + 1)
  const startIso = start.toISOString().slice(0, 10)

  return sessoes.filter((s) =>
  {
    if (!sessaoFinalizada(s))
    {
      return false
    }
    return diaFromSessao(s) >= startIso
  })
}

function emptyRow(label: string): AnalyticsChartRow
{
  return { label, proteina: 0, aguaLitros: 0, treinoMin: 0, concluidas: 0, abertas: 0 }
}

export function sessionsPerWeek(
  sessoes: SessaoTreino[],
  refDate: Date,
  timeframe: AnalyticsTimeframe,
): AnalyticsChartRow[]
{
  const days = timeframeDays(timeframe)
  const filtered = filterSessoesByDays(sessoes, days, refDate)

  if (timeframe === '6M')
  {
    const rows: AnalyticsChartRow[] = []
    const weekMs = 7 * 86400000
    const end = new Date(refDate)
    end.setHours(23, 59, 59, 999)

    for (let w = 25; w >= 0; w--)
    {
      const weekEnd = new Date(end.getTime() - w * weekMs)
      const weekStart = new Date(weekEnd.getTime() - 6 * 86400000)
      const startIso = weekStart.toISOString().slice(0, 10)
      const endIso = weekEnd.toISOString().slice(0, 10)
      const label = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

      const treinoMin = filtered
        .filter((s) =>
        {
          const d = diaFromSessao(s)
          return d >= startIso && d <= endIso
        })
        .reduce((acc, s) => acc + (s.duracao_real_min ?? 0), 0)

      rows.push({ ...emptyRow(label), treinoMin })
    }
    return rows
  }

  const bucketDays = timeframe === '1W' ? 7 : 30
  const rows: AnalyticsChartRow[] = []

  for (let i = bucketDays - 1; i >= 0; i--)
  {
    const d = new Date(refDate)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    const label = timeframe === '1W'
      ? d.toLocaleDateString('pt-BR', { weekday: 'short' })
      : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

    const treinoMin = filtered
      .filter((s) => diaFromSessao(s) === iso)
      .reduce((acc, s) => acc + (s.duracao_real_min ?? 0), 0)

    rows.push({ ...emptyRow(label), treinoMin })
  }

  return rows
}

export function maxLoadByExercise(
  sessoes: SessaoTreino[],
  month?: string,
): Record<string, AcademyLoadTrendPoint[]>
{
  const filtered = sessoes.filter(sessaoFinalizada)
  const porExercicio: Record<string, AcademyLoadTrendPoint[]> = {}

  for (const s of filtered)
  {
    const dia = diaFromSessao(s)
    if (month && !dia.startsWith(month))
    {
      continue
    }

    const detalhe = s.detalhe
    if (!detalhe?.exercicios?.length)
    {
      continue
    }

    for (const ex of detalhe.exercicios)
    {
      const melhor = ex.series.reduce(
        (best, serie) => (serie.peso_kg > best.peso_kg ? serie : best),
        ex.series[0],
      )
      if (!melhor)
      {
        continue
      }

      const d = new Date(`${dia}T12:00:00`)
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      const lista = porExercicio[ex.id] ?? []
      lista.push({
        data: dia,
        label,
        peso_kg: melhor.peso_kg,
        reps: melhor.reps,
      })
      porExercicio[ex.id] = lista.sort((a, b) => a.data.localeCompare(b.data))
    }
  }

  return porExercicio
}

export function topExerciciosPorVolume(
  sessoes: SessaoTreino[],
  limit = 5,
): { id: string; nome: string }[]
{
  const vol: Record<string, { id: string; nome: string; v: number }> = {}

  for (const s of filterSessoesByDays(sessoes, 30))
  {
    const detalhe = s.detalhe
    if (!detalhe)
    {
      continue
    }
    for (const ex of detalhe.exercicios)
    {
      const v = ex.series.reduce((acc, serie) => acc + serie.peso_kg * serie.reps, 0)
      const atual = vol[ex.id] ?? { id: ex.id, nome: ex.nome || ex.id, v: 0 }
      atual.v += v
      atual.nome = ex.nome || ex.id
      vol[ex.id] = atual
    }
  }

  return Object.values(vol)
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map(({ id, nome }) => ({ id, nome }))
}

export function monthlyPRs(sessoes: SessaoTreino[], month: string): AcademyPR[]
{
  const antes: Record<string, number> = {}
  const noMes: AcademyPR[] = []

  const ordenadas = [...sessoes]
    .filter(sessaoFinalizada)
    .sort((a, b) => diaFromSessao(a).localeCompare(diaFromSessao(b)))

  for (const s of ordenadas)
  {
    const dia = diaFromSessao(s)
    const detalhe = s.detalhe
    if (!detalhe)
    {
      continue
    }

    for (const ex of detalhe.exercicios)
    {
      const maxCarga = ex.series.reduce((m, serie) => Math.max(m, serie.peso_kg), 0)
      if (maxCarga <= 0)
      {
        continue
      }

      const prev = antes[ex.id] ?? 0
      if (dia.startsWith(month) && maxCarga > prev)
      {
        noMes.push({
          exercicio: ex.nome || ex.id,
          exercicio_id: ex.id,
          carga_kg: maxCarga,
          data: dia,
        })
      }
      antes[ex.id] = Math.max(prev, maxCarga)
    }
  }

  return noMes.sort((a, b) => b.carga_kg - a.carga_kg)
}

export function trainingHeatmap(sessoes: SessaoTreino[], year: number): AcademyHeatmapDay[]
{
  const map = new Map<string, AcademyHeatmapDay>()

  for (const s of sessoes.filter(sessaoFinalizada))
  {
    const dia = diaFromSessao(s)
    if (!dia.startsWith(String(year)))
    {
      continue
    }
    const atual = map.get(dia) ?? { date: dia, count: 0, volume: 0 }
    atual.count += 1
    atual.volume += s.volume_kg ?? s.detalhe?.volume_kg ?? 0
    map.set(dia, atual)
  }

  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function consistencyPct(
  sessoes: SessaoTreino[],
  days: number,
  refDate = new Date(),
): number
{
  if (days <= 0)
  {
    return 0
  }
  const filtered = filterSessoesByDays(sessoes, days, refDate)
  const uniqueDays = new Set(filtered.map(diaFromSessao))
  return Math.min(100, Math.round((uniqueDays.size / days) * 100))
}

export function totalVolumePeriodo(sessoes: SessaoTreino[], days: number): number
{
  return filterSessoesByDays(sessoes, days).reduce(
    (acc, s) => acc + (s.volume_kg ?? s.detalhe?.volume_kg ?? 0),
    0,
  )
}

export function sessoesConcluidasPeriodo(sessoes: SessaoTreino[], days: number): number
{
  return filterSessoesByDays(sessoes, days).filter((s) => s.concluido).length
}
