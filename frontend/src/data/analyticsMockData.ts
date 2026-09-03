// Tipos de analytics - dados reais via buildAnalyticsBundle (lib/buildAnalyticsBundle.ts)

export type AnalyticsTimeframe = '1W' | '1M' | '6M'

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

const EMPTY_BUNDLE: AnalyticsBundle = {
  rows: [],
  proteinMeta: 100,
  eggsToday: 0,
  eggMax: 4,
  exerciseConsistencyPct: 0,
  orchestrationScore: 0,
}

export const ANALYTICS_TIMEFRAME_LABELS: { id: AnalyticsTimeframe; label: string }[] = [
  { id: '1W', label: '7d' },
  { id: '1M', label: '30d' },
  { id: '6M', label: '6m' },
]

export const ANALYTICS_BY_TIMEFRAME: Record<AnalyticsTimeframe, AnalyticsBundle> = {
  '1W': EMPTY_BUNDLE,
  '1M': EMPTY_BUNDLE,
  '6M': EMPTY_BUNDLE,
}
