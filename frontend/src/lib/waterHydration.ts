import type { HabitoDiario } from '../store/storeTypes'
import { localTodayIso } from './healthDayBoundary'

export const DEFAULT_ML_POR_COPO = 200
export const GARRAFA_MIN_ML = 500

export const ML_OPCOES = [150, 200, 250, 300, 500, 750, 1000] as const

export function mlPorCopo(h: HabitoDiario | undefined): number
{
  return h?.config?.ml_por_copo ?? DEFAULT_ML_POR_COPO
}

export function registrosMl(h: HabitoDiario | undefined): number[]
{
  if (!h) return []

  const today = localTodayIso()
  if (h.config?.ultima_data && h.config.ultima_data !== today)
  {
    return []
  }

  const cfg = h.config?.registros_ml
  if (cfg && cfg.length > 0) return cfg
  const n = h?.progresso_atual ?? 0
  const unit = mlPorCopo(h)
  return Array.from({ length: n }, () => unit)
}

export function totalMlHoje(h: HabitoDiario | undefined): number
{
  return registrosMl(h).reduce((acc, v) => acc + v, 0)
}

export function metaMl(h: HabitoDiario | undefined): number
{
  return (h?.meta_diaria ?? 8) * mlPorCopo(h)
}

export function isGarrafa(ml: number): boolean
{
  return ml >= GARRAFA_MIN_ML
}
