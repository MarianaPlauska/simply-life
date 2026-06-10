// Dados mockados — séries temporais para Recharts (Visão Holística)

export type AnalyticsTimeframe = '1W' | '1M' | '6M'

/** Linha unificada por bucket temporal (dia, semana ou mês) */
export interface AnalyticsChartRow
{
  label: string
  proteina: number
  aguaLitros: number
  treinoMin: number
  concluidas: number
  abertas: number
}

export interface AnalyticsBundle
{
  rows: AnalyticsChartRow[]
  proteinMeta: number
  eggsToday: number
  eggMax: number
  exerciseConsistencyPct: number
  orchestrationScore: number
}

const WEEK_ROWS: AnalyticsChartRow[] = [
  { label: 'Seg', proteina: 42, aguaLitros: 1.2, treinoMin: 45, concluidas: 4, abertas: 12 },
  { label: 'Ter', proteina: 58, aguaLitros: 1.5, treinoMin: 0, concluidas: 6, abertas: 11 },
  { label: 'Qua', proteina: 65, aguaLitros: 1.0, treinoMin: 50, concluidas: 5, abertas: 10 },
  { label: 'Qui', proteina: 72, aguaLitros: 1.75, treinoMin: 40, concluidas: 8, abertas: 9 },
  { label: 'Sex', proteina: 55, aguaLitros: 1.4, treinoMin: 0, concluidas: 7, abertas: 11 },
  { label: 'Sáb', proteina: 80, aguaLitros: 1.5, treinoMin: 60, concluidas: 9, abertas: 8 },
  { label: 'Dom', proteina: 62, aguaLitros: 0.9, treinoMin: 35, concluidas: 6, abertas: 9 },
]

const MONTH_ROWS: AnalyticsChartRow[] = [
  { label: 'S1', proteina: 48, aguaLitros: 1.3, treinoMin: 120, concluidas: 22, abertas: 38 },
  { label: 'S2', proteina: 52, aguaLitros: 1.4, treinoMin: 90, concluidas: 28, abertas: 35 },
  { label: 'S3', proteina: 61, aguaLitros: 1.6, treinoMin: 150, concluidas: 25, abertas: 32 },
  { label: 'S4', proteina: 70, aguaLitros: 1.5, treinoMin: 110, concluidas: 31, abertas: 29 },
]

const SIX_MONTH_ROWS: AnalyticsChartRow[] = [
  { label: 'Dez', proteina: 55, aguaLitros: 1.2, treinoMin: 480, concluidas: 118, abertas: 42 },
  { label: 'Jan', proteina: 62, aguaLitros: 1.35, treinoMin: 520, concluidas: 125, abertas: 38 },
  { label: 'Fev', proteina: 58, aguaLitros: 1.28, treinoMin: 440, concluidas: 112, abertas: 45 },
  { label: 'Mar', proteina: 71, aguaLitros: 1.5, treinoMin: 560, concluidas: 138, abertas: 36 },
  { label: 'Abr', proteina: 64, aguaLitros: 1.42, treinoMin: 500, concluidas: 131, abertas: 40 },
  { label: 'Mai', proteina: 69, aguaLitros: 1.48, treinoMin: 530, concluidas: 142, abertas: 33 },
]

export const ANALYTICS_BY_TIMEFRAME: Record<AnalyticsTimeframe, AnalyticsBundle> = {
  '1W': { rows: WEEK_ROWS, proteinMeta: 100, eggsToday: 2, eggMax: 3, exerciseConsistencyPct: 71, orchestrationScore: 82 },
  '1M': { rows: MONTH_ROWS, proteinMeta: 100, eggsToday: 1, eggMax: 3, exerciseConsistencyPct: 68, orchestrationScore: 76 },
  '6M': { rows: SIX_MONTH_ROWS, proteinMeta: 100, eggsToday: 0, eggMax: 3, exerciseConsistencyPct: 74, orchestrationScore: 88 },
}

export const ANALYTICS_TIMEFRAME_LABELS: { id: AnalyticsTimeframe; label: string }[] = [
  { id: '1W', label: '1 Semana' },
  { id: '1M', label: '1 Mês' },
  { id: '6M', label: '6 Meses' },
]

/** @deprecated use AnalyticsTimeframe */
export type AnalyticsPeriod = '1w' | '1m' | '6m'
