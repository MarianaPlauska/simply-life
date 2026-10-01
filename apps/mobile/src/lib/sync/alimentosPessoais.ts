import type { FoodPersonalKcal } from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'

/**
 * Calorias pessoais por item (migração 068). Sem sessão ou sem a tabela, devolve null/false
 * e o app segue só com a cópia do aparelho.
 */

type Row = { item_key: string; kcal: number | string; porcao: string | null; updated_at: string }

async function uid(): Promise<string | null>
{
  if (!supabaseConfigured) return null
  return (await supabase.auth.getUser()).data.user?.id ?? null
}

export async function fetchAlimentosPessoais(): Promise<Record<string, FoodPersonalKcal> | null>
{
  const user = await uid()
  if (!user) return null
  const { data, error } = await supabase
    .from('alimentos_pessoais')
    .select('item_key, kcal, porcao, updated_at')
    .eq('user_id', user)
  if (error) return null
  const out: Record<string, FoodPersonalKcal> = {}
  for (const r of (data ?? []) as Row[])
  {
    const kcal = Number(r.kcal)
    if (!r.item_key || !Number.isFinite(kcal)) continue
    out[r.item_key] = { kcal, porcao: r.porcao, updatedAt: r.updated_at }
  }
  return out
}

export async function upsertAlimentosPessoais(entries: [string, FoodPersonalKcal][]): Promise<boolean>
{
  if (!entries.length) return true
  const user = await uid()
  if (!user) return false
  const { error } = await supabase.from('alimentos_pessoais').upsert(
    entries.map(([item_key, v]) => ({
      user_id: user,
      item_key,
      kcal: v.kcal,
      porcao: v.porcao,
      updated_at: v.updatedAt,
    })),
  )
  return !error
}
