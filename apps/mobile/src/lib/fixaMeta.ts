import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import {
  FINANCE_CATEGORY_SERIES,
  financeSeriesFromStored,
  isBuiltinFinanceCategory,
} from '@simply-life/shared'
import type { ChartSeries } from '@simply-life/ui-tokens'
import { DEFAULT_CATEGORY_ICONS } from './categoryMeta'

const KEY = 'simply_life_finance_fixa_meta_v1'

export type FixaUrgencia = 1 | 2 | 3

export type FixaMeta = {
  /** Chave da paleta categórica; dados antigos podem trazer hex (ver `resolveFixaMeta`). */
  color: string
  urgencia: FixaUrgencia
  icon: string
}

export type FixaMetaMap = Record<string, Partial<FixaMeta>>

export const FIXA_URGENCIA_LABELS: Record<FixaUrgencia, string> = {
  1: 'Alta',
  2: 'Média',
  3: 'Baixa',
}

export type ResolvedFixaMeta = Omit<FixaMeta, 'color'> & { color: ChartSeries }

/** Chave padrão: a da categoria da conta; categoria desconhecida fica em ardósia. */
export function defaultFixaColor(categoria: string): ChartSeries
{
  const k = categoria.toLowerCase()
  return isBuiltinFinanceCategory(k) ? FINANCE_CATEGORY_SERIES[k] : 'slate'
}

export function defaultFixaIcon(categoria: string): string
{
  const k = categoria.toLowerCase() as keyof typeof DEFAULT_CATEGORY_ICONS
  return DEFAULT_CATEGORY_ICONS[k] ?? 'circle'
}

export function defaultFixaMeta(categoria: string): ResolvedFixaMeta
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
): ResolvedFixaMeta
{
  const base = defaultFixaMeta(categoria)
  const extra = map[String(id)]
  return {
    ...base,
    ...extra,
    // chave, hex antigo ou hex qualquer viram chave; vazio fica no padrão da categoria
    color: extra?.color ? financeSeriesFromStored(extra.color, categoria) : base.color,
  }
}
