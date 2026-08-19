import type { HabitoDiario } from '../store/storeTypes'
import { localTodayIso, readCachedWaterEntries, waterPrefsStorageKey } from './healthDayBoundary'
import { readScopedJson, writeScopedJson } from './userScopedStorage'

export interface WaterLocalPrefs
{
  ml_por_copo?: number
  ml_presets?: number[]
  ml_ocultos?: number[]
}

export function readLocalWaterPrefs(): WaterLocalPrefs
{
  return readScopedJson<WaterLocalPrefs>(waterPrefsStorageKey()) ?? {}
}

export function persistLocalWaterPrefs(patch: WaterLocalPrefs): void
{
  writeScopedJson(waterPrefsStorageKey(), { ...readLocalWaterPrefs(), ...patch })
}

export const DEFAULT_ML_POR_COPO = 200
/** Meta visual padrão: 10 copos de 200 ml = 2 L */
export const DEFAULT_AGUA_COPOS = 10
export const META_AGUA_ML = DEFAULT_AGUA_COPOS * DEFAULT_ML_POR_COPO
export const GARRAFA_MIN_ML = 500

export function coposParaDoisLitros(ml: number): number
{
  const unit = clampMl(ml)
  return Math.max(1, Math.round(META_AGUA_ML / unit))
}

/** 8 × 200 ml era 1,6 L — legado a promover para 2 L */
export function isLegacyAgua16L(metaCopos: number, ml: number): boolean
{
  return metaCopos === 8 && ml === DEFAULT_ML_POR_COPO
}

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
  const local = readLocalWaterPrefs().ml_presets ?? []
  const remote = h?.config?.ml_presets ?? []
  return normalizeMlPresets([...remote, ...local])
}

export function hiddenMlPresets(h: HabitoDiario | undefined): number[]
{
  const local = readLocalWaterPrefs().ml_ocultos ?? []
  const remote = h?.config?.ml_ocultos ?? []
  return normalizeMlPresets([...remote, ...local])
}

/** Atalhos visíveis — padrões do app (menos ocultos) + personalizados + ml padrão atual */
export function resolveMlPresets(h: HabitoDiario | undefined): number[]
{
  const hidden = new Set(hiddenMlPresets(h))
  const custom = customMlPresets(h)
  const builtIn = ML_OPCOES.filter((ml) => !hidden.has(ml))
  const defaultMl = mlPorCopo(h)
  const merged = [...new Set([...builtIn, ...custom, defaultMl])]
  return merged.sort((a, b) => a - b)
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

/** Patch único para ml padrão + atalho personalizado (evita corrida entre saves). */
export function buildDefaultMlPatch(h: HabitoDiario | undefined, ml: number): {
  ml_por_copo: number
  ml_presets?: number[]
  ml_ocultos?: number[]
}
{
  const value = clampMl(ml)
  if (isBuiltInMlPreset(value))
  {
    return { ml_por_copo: value }
  }
  return {
    ml_por_copo: value,
    ...patchMlPresetChange(h, 'add', value),
  }
}

function readLocalMlPorCopo(): number | null
{
  const local = readLocalWaterPrefs().ml_por_copo
  if (typeof local === 'number' && local > 0) return local

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
  persistLocalWaterPrefs({ ml_por_copo: ml })
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

  const cached = readCachedWaterEntries()
  if (cached && cached.length > 0) return cached

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
  return (h?.meta_diaria ?? DEFAULT_AGUA_COPOS) * mlPorCopo(h)
}

export function formatLiters(ml: number): string
{
  const liters = ml / 1000
  if (!Number.isFinite(liters) || liters <= 0) return '0 L'
  const rounded = Math.round(liters * 10) / 10
  const label = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace('.', ',')
  return `${label} L`
}

export function isGarrafa(ml: number): boolean
{
  return ml >= GARRAFA_MIN_ML
}
