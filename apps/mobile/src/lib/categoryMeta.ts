import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import {
  FINANCE_CATEGORY_LABELS,
  FINANCE_CATEGORY_SERIES,
  defaultFolderSeries,
  financeSeriesFromStored,
  type FinanceCategory,
} from '@simply-life/shared'
import { CHART_SERIES, type ChartSeries } from '@simply-life/ui-tokens'
import { resolveFinanceIconName, type FinanceIconName } from './financeIcons'

const KEY = 'simply_life_finance_cat_meta_v1'

export const BUILTIN_FINANCE_CATEGORIES: FinanceCategory[] = [
  'alimentacao',
  'transporte',
  'habitacao',
  'compras',
  'lazer',
  'saude',
  'educacao',
  'outros',
]

export type CategoryMeta = {
  label: string
  icon: FinanceIconName | string
  /**
   * Chave da paleta categórica (`ChartSeries`). Dados antigos podem trazer hex;
   * `resolveCategoryMeta` já devolve a chave. Pinte com `seriesColor(color, chart)`.
   */
  color: string
  custom?: boolean
  hidden?: boolean
}

export type ResolvedCategoryMeta = Omit<CategoryMeta, 'color'> & { color: ChartSeries }

/** Amostras do seletor: as 8 chaves da paleta (a cor sai do modo atual). */
export const FINANCE_SWATCHES: readonly ChartSeries[] = CHART_SERIES

export type CategoryMetaMap = Record<string, CategoryMeta>

export const DEFAULT_CATEGORY_ICONS: Record<keyof typeof FINANCE_CATEGORY_LABELS, FinanceIconName> = {
  habitacao: 'home',
  alimentacao: 'utensils',
  transporte: 'car',
  lazer: 'gamepad-2',
  saude: 'heart-pulse',
  educacao: 'graduation-cap',
  compras: 'shopping-cart',
  outros: 'circle',
}

/** Índice estável a partir do id, para categorias criadas sem cor escolhida. */
function hashIndex(id: string): number
{
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function defaultCategoryMeta(id: string): ResolvedCategoryMeta
{
  const builtin = FINANCE_CATEGORY_LABELS[id as FinanceCategory]
  if (builtin)
  {
    const key = id as keyof typeof FINANCE_CATEGORY_SERIES
    return {
      label: builtin,
      icon: DEFAULT_CATEGORY_ICONS[key],
      color: FINANCE_CATEGORY_SERIES[key],
    }
  }
  return {
    label: id,
    icon: 'circle',
    color: defaultFolderSeries(hashIndex(id)),
    custom: true,
  }
}

/** Primeira chave ainda não usada pelas categorias visíveis (ou a próxima do ciclo). */
export function nextFreeCategorySeries(map: CategoryMetaMap): ChartSeries
{
  const ids = visibleCategoryIds(map)
  const used = new Set(ids.map((id) => resolveCategoryMeta(id, map).color))
  return CHART_SERIES.find((k) => !used.has(k)) ?? defaultFolderSeries(ids.length)
}

/** Valor guardado (chave) por categoria, embutidas e criadas pela pessoa. */
export function colorMapFromMeta(
  map: CategoryMetaMap,
): Partial<Record<FinanceCategory, string>>
{
  const out: Partial<Record<FinanceCategory, string>> = {}
  const ids = new Set<string>([...BUILTIN_FINANCE_CATEGORIES, ...Object.keys(map)])
  for (const id of ids)
  {
    if (map[id]?.color) out[id] = resolveCategoryMeta(id, map).color
  }
  return out
}

export function slugCategoryId(label: string): string
{
  const base = label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24)
  return `c-${base || 'cat'}`
}

export function visibleCategoryIds(map: CategoryMetaMap): string[]
{
  const customs = Object.keys(map).filter((id) => map[id]?.custom && !map[id]?.hidden)
  const builtins = BUILTIN_FINANCE_CATEGORIES.filter((id) => !map[id]?.hidden)
  return [...builtins, ...customs]
}

async function readRaw(): Promise<string | null>
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      return localStorage.getItem(KEY)
    }
    return await SecureStore.getItemAsync(KEY)
  }
  catch
  {
    return null
  }
}

async function writeRaw(value: string): Promise<void>
{
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
  {
    localStorage.setItem(KEY, value)
    return
  }
  await SecureStore.setItemAsync(KEY, value)
}

export async function loadCategoryMeta(): Promise<CategoryMetaMap>
{
  const raw = await readRaw()
  if (!raw) return {}
  try
  {
    return JSON.parse(raw) as CategoryMetaMap
  }
  catch
  {
    return {}
  }
}

export async function saveCategoryMeta(map: CategoryMetaMap): Promise<void>
{
  await writeRaw(JSON.stringify(map))
}

export function resolveCategoryMeta(id: string, map: CategoryMetaMap): ResolvedCategoryMeta
{
  const base = defaultCategoryMeta(id)
  const extra = map[id]
  const merged = { ...base, ...extra }
  return {
    ...merged,
    icon: resolveFinanceIconName(String(merged.icon)),
    // chave, hex antigo ou hex qualquer viram chave; vazio fica no padrão
    color: financeSeriesFromStored(extra?.color, id, hashIndex(id)),
  }
}
