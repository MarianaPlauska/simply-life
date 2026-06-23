import type { HabitoDiario } from '../store/storeTypes'
import { localTodayIso, waterPrefsStorageKey } from './healthDayBoundary'

export const DEFAULT_ML_POR_COPO = 200
export const GARRAFA_MIN_ML = 500

export const ML_OPCOES = [150, 200, 250, 300, 500, 750, 1000] as const
export const ML_MIN = 50
export const ML_MAX = 2000

export function clampMl(raw: number): number
{
  if (!Number.isFinite(raw))
  {
    return DEFAULT_ML_POR_COPO
  }
  return Math.min(ML_MAX, Math.max(ML_MIN, Math.round(raw)))
}

export function parseMlInput(raw: string): number | null
{
  const n = parseInt(raw.replace(/\D/g, ''), 10)
  if (!Number.isFinite(n) || n < ML_MIN)
  {
    return null
  }
  return clampMl(n)
}

export function isBuiltInMlPreset(ml: number): boolean
{
  return (ML_OPCOES as readonly number[]).includes(ml)
}

export function customMlPresets(h: HabitoDiario | undefined): number[]
{
  return normalizeMlPresets(h?.config?.ml_presets ?? [])
}

export function hiddenMlPresets(h: HabitoDiario | undefined): number[]
{
  return normalizeMlPresets(h?.config?.ml_ocultos ?? [])
}

/** Atalhos visíveis — padrões do app (menos ocultos) + personalizados */
export function resolveMlPresets(h: HabitoDiario | undefined): number[]
{
  const hidden = new Set(hiddenMlPresets(h))
  const custom = customMlPresets(h)
  const builtIn = ML_OPCOES.filter((ml) => !hidden.has(ml))
  return [...new Set([...builtIn, ...custom])].sort((a, b) => a - b)
}

export function normalizeMlPresets(presets: number[]): number[]
{
  return [...new Set(presets.map(clampMl))].sort((a, b) => a - b)
}

/** Persistência ao adicionar ou remover atalho visível */
export function patchMlPresetChange(
  h: HabitoDiario | undefined,
  action: 'add' | 'remove',
  ml: number,
): { ml_presets: number[]; ml_ocultos: number[] }
{
  const value = clampMl(ml)
  let custom = customMlPresets(h)
  let hidden = hiddenMlPresets(h)

  if (action === 'add')
  {
    if (isBuiltInMlPreset(value))
    {
      hidden = hidden.filter((x) => x !== value)
    }
    else if (!custom.includes(value))
    {
      custom = [...custom, value]
    }
  }
  else
  {
    if (isBuiltInMlPreset(value))
    {
      if (!hidden.includes(value))
      {
        hidden = [...hidden, value]
      }
    }
    else
    {
      custom = custom.filter((x) => x !== value)
    }
  }

  return {
    ml_presets: custom,
    ml_ocultos: hidden,
  }
}

function readLocalMlPorCopo(): number | null
{
  try
  {
    const raw = localStorage.getItem(waterPrefsStorageKey())
    if (!raw) return null
    const parsed = JSON.parse(raw) as { ml_por_copo?: number }
    const ml = parsed.ml_por_copo
    if (typeof ml === 'number' && ml > 0) return ml
  }
  catch { /* ignore */ }
  return null
}

export function persistLocalMlPorCopo(ml: number): void
{
  try
  {
    localStorage.setItem(waterPrefsStorageKey(), JSON.stringify({ ml_por_copo: ml }))
  }
  catch { /* quota */ }
}

export function mlPorCopo(h: HabitoDiario | undefined): number
{
  if (h?.config?.ml_por_copo)
  {
    return h.config.ml_por_copo
  }
  return readLocalMlPorCopo() ?? DEFAULT_ML_POR_COPO
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
