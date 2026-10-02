import type { FoodPersonalKcal } from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'
import { isMissingColumnError } from './refeicoes'

/**
 * Calorias pessoais por item (migração 068). Sem sessão ou sem a tabela, devolve null/false
 * e o app segue só com a cópia do aparelho.
 */

type Row = {
  item_key: string
  kcal: number | string
  /** só depois da migração 077 */
  proteina?: number | string | null
  acucar?: number | string | null
  porcao: string | null
  updated_at: string
}

/** Colunas de proteína e açúcar (077); sem elas no servidor, segue só com kcal nesta sessão. */
let nutrientColumns = true
let warned = false

function disableNutrientColumns(): void
{
  nutrientColumns = false
  if (!warned)
  {
    warned = true
    console.warn('[alimentos_pessoais] servidor sem proteína e açúcar (migração 077); seguindo só com kcal')
  }
}

function numOrNull(v: number | string | null | undefined): number | null
{
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function uid(): Promise<string | null>
{
  if (!supabaseConfigured) return null
  return (await supabase.auth.getUser()).data.user?.id ?? null
}

export async function fetchAlimentosPessoais(): Promise<Record<string, FoodPersonalKcal> | null>
{
  const user = await uid()
  if (!user) return null
  const run = (withNutrients: boolean) => supabase
    .from('alimentos_pessoais')
    .select(withNutrients ? 'item_key, kcal, proteina, acucar, porcao, updated_at' : 'item_key, kcal, porcao, updated_at')
    .eq('user_id', user)
  let res = await run(nutrientColumns)
  if (res.error && nutrientColumns && isMissingColumnError(res.error))
  {
    disableNutrientColumns()
    res = await run(false)
  }
  const { data, error } = res
  if (error) return null
  const out: Record<string, FoodPersonalKcal> = {}
  for (const r of (data ?? []) as unknown as Row[])
  {
    const kcal = Number(r.kcal)
    if (!r.item_key || !Number.isFinite(kcal)) continue
    out[r.item_key] = {
      kcal,
      ...('proteina' in r ? { proteina: numOrNull(r.proteina) } : {}),
      ...('acucar' in r ? { acucar: numOrNull(r.acucar) } : {}),
      porcao: r.porcao,
      updatedAt: r.updated_at,
    }
  }
  return out
}

export async function upsertAlimentosPessoais(entries: [string, FoodPersonalKcal][]): Promise<boolean>
{
  if (!entries.length) return true
  const user = await uid()
  if (!user) return false
  const rows = (withNutrients: boolean) => entries.map(([item_key, v]) => ({
    user_id: user,
    item_key,
    kcal: v.kcal,
    ...(withNutrients ? { proteina: v.proteina ?? null, acucar: v.acucar ?? null } : {}),
    porcao: v.porcao,
    updated_at: v.updatedAt,
  }))
  let res = await supabase.from('alimentos_pessoais').upsert(rows(nutrientColumns))
  if (res.error && nutrientColumns && isMissingColumnError(res.error))
  {
    disableNutrientColumns()
    res = await supabase.from('alimentos_pessoais').upsert(rows(false))
  }
  return !res.error
}
