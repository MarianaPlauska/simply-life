// Monta bundle de analytics holístico a partir do store

import type { AnalyticsBundle, AnalyticsChartRow, AnalyticsTimeframe } from '../data/analyticsMockData'
import type { HabitoDiario, SessaoTreino } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { consistencyPct, sessionsPerWeek, timeframeDays } from './academyAnalytics'
import { totalMlHoje } from './waterHydration'

export interface AnalyticsStoreSnapshot
{
  habitos: HabitoDiario[]
  tarefas: TarefaUnificada[]
  sessoesTreino: SessaoTreino[]
}

function tarefasPorDia(
  tarefas: TarefaUnificada[],
  iso: string,
): { concluidas: number; abertas: number }
{
  const doDia = tarefas.filter((t) =>
  {
    const d = (t.data_vencimento || t.created_at || '').slice(0, 10)
    return d === iso
  })
  return {
    concluidas: doDia.filter((t) => t.status === 'concluida').length,
    abertas: doDia.filter((t) => t.status !== 'concluida').length,
  }
}

export function buildAnalyticsBundle(
  snapshot: AnalyticsStoreSnapshot,
  timeframe: AnalyticsTimeframe,
  refDate = new Date(),
): AnalyticsBundle
{
  const proteina = snapshot.habitos.find((h) => h.tipo === 'proteina')
  const agua = snapshot.habitos.find((h) => h.tipo === 'agua')
  const days = timeframeDays(timeframe)

  const exerciseRows = sessionsPerWeek(snapshot.sessoesTreino, refDate, timeframe)

  const rows: AnalyticsChartRow[] = exerciseRows.map((row, i) =>
  {
    const d = new Date(refDate)
    d.setDate(d.getDate() - (exerciseRows.length - 1 - i))
    const iso = d.toISOString().slice(0, 10)
    const tasks = tarefasPorDia(snapshot.tarefas, iso)

    return {
      ...row,
      proteina: i === exerciseRows.length - 1 ? (proteina?.progresso_atual ?? 0) : 0,
      aguaLitros: i === exerciseRows.length - 1
        ? Math.round((totalMlHoje(agua) / 1000) * 10) / 10
        : 0,
      concluidas: tasks.concluidas,
      abertas: tasks.abertas,
    }
  })

  const concluidasTotal = rows.reduce((s, r) => s + r.concluidas, 0)
  const abertasTotal = rows.reduce((s, r) => s + r.abertas, 0)
  const orchestrationScore = concluidasTotal + abertasTotal > 0
    ? Math.round((concluidasTotal / (concluidasTotal + abertasTotal)) * 100)
    : 0

  return {
    rows,
    proteinMeta: proteina?.meta_diaria ?? 100,
    eggsToday: Math.max(0, Math.round((proteina?.progresso_atual ?? 0) / 13)),
    eggMax: 4,
    exerciseConsistencyPct: consistencyPct(snapshot.sessoesTreino, days, refDate),
    orchestrationScore,
  }
}

export function hasAnalyticsData(bundle: AnalyticsBundle): boolean
{
  if (bundle.rows.some((r) => r.treinoMin > 0))
  {
    return true
  }
  if (bundle.rows.some((r) => r.concluidas > 0 || r.abertas > 0))
  {
    return true
  }
  if (bundle.exerciseConsistencyPct > 0)
  {
    return true
  }
  return false
}
