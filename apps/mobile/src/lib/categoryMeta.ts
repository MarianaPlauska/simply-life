import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import {
  FINANCE_CATEGORY_COLORS,
  FINANCE_CATEGORY_LABELS,
  FOLDER_PALETTE,
  type FinanceCategory,
} from '@simply-life/shared'
import { resolveLucideFinanceName, type LucideFinanceName } from './lucideFinanceIcons'

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
  icon: LucideFinanceName | string
  color: string
  custom?: boolean
  hidden?: boolean
}

export const FINANCE_SWATCHES: string[] = [
  ...new Set<string>([...FOLDER_PALETTE, ...Object.values(FINANCE_CATEGORY_COLORS)]),
]

export type CategoryMetaMap = Record<string, CategoryMeta>

export const DEFAULT_CATEGORY_ICONS: Record<keyof typeof FINANCE_CATEGORY_LABELS, LucideFinanceName> = {
  habitacao: 'home',
  alimentacao: 'utensils',
  transporte: 'car',
  lazer: 'gamepad-2',
  saude: 'heart-pulse',
  educacao: 'graduation-cap',
  compras: 'shopping-cart',
  outros: 'circle',
}

export function defaultCategoryMeta(id: string): CategoryMeta
{
  const builtin = FINANCE_CATEGORY_LABELS[id as FinanceCategory]
  if (builtin)
  {
    const key = id as FinanceCategory
    return {
      label: builtin,
      icon: DEFAULT_CATEGORY_ICONS[key],
      color: FINANCE_CATEGORY_COLORS[key],
    }
  }
  return {
    label: id,
    icon: 'circle',
    color: '#E8734A',
    custom: true,
  }
}

export function colorMapFromMeta(
  map: CategoryMetaMap,
): Partial<Record<FinanceCategory, string>>
{
  const out: Partial<Record<FinanceCategory, string>> = {}
  for (const id of BUILTIN_FINANCE_CATEGORIES)
  {
    const color = map[id]?.color
    if (color) out[id] = color
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

export function resolveCategoryMeta(id: string, map: CategoryMetaMap): CategoryMeta
{
  const base = defaultCategoryMeta(id)
  const extra = map[id]
  const merged = { ...base, ...extra }
  return {
    ...merged,
    icon: resolveLucideFinanceName(String(merged.icon)),
  }
}
