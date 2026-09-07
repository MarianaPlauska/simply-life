import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import {
  FINANCE_CATEGORY_COLORS,
  type FinanceCategory,
} from '@simply-life/shared'
import { DEFAULT_CATEGORY_ICONS } from './categoryMeta'

const KEY = 'simply_life_finance_fixa_meta_v1'

export type FixaUrgencia = 1 | 2 | 3

export type FixaMeta = {
  color: string
  urgencia: FixaUrgencia
  icon: string
}

export type FixaMetaMap = Record<string, Partial<FixaMeta>>

const CATEGORIES = new Set<FinanceCategory>([
  'habitacao',
  'alimentacao',
  'transporte',
  'lazer',
  'saude',
  'educacao',
  'compras',
  'outros',
])

export const FIXA_URGENCIA_LABELS: Record<FixaUrgencia, string> = {
  1: 'Alta',
  2: 'Média',
  3: 'Baixa',
}

export function defaultFixaColor(categoria: string): string
{
  const k = categoria.toLowerCase() as FinanceCategory
  if (CATEGORIES.has(k)) return FINANCE_CATEGORY_COLORS[k]
  return '#E8734A'
}

export function defaultFixaIcon(categoria: string): string
{
  const k = categoria.toLowerCase() as keyof typeof DEFAULT_CATEGORY_ICONS
  return DEFAULT_CATEGORY_ICONS[k] ?? 'circle'
}

export function defaultFixaMeta(categoria: string): FixaMeta
{
  return {
    color: defaultFixaColor(categoria),
    urgencia: 2,
    icon: defaultFixaIcon(categoria),
  }
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

export async function loadFixaMeta(): Promise<FixaMetaMap>
{
  const raw = await readRaw()
  if (!raw) return {}
  try
  {
    return JSON.parse(raw) as FixaMetaMap
  }
  catch
  {
    return {}
  }
}

export async function saveFixaMeta(map: FixaMetaMap): Promise<void>
{
  await writeRaw(JSON.stringify(map))
}

export function resolveFixaMeta(
  id: string | number,
  map: FixaMetaMap,
  categoria: string,
): FixaMeta
{
  return { ...defaultFixaMeta(categoria), ...map[String(id)] }
}
