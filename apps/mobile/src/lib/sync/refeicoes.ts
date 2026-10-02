import type { FoodItem, FoodMealType } from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'

/** Refeição como o app guarda (local e na nuvem). */
export type Refeicao = {
  /** uuid gerado no app */
  id: string
  data: string
  /** "HH:MM" */
  hora: string | null
  tipo: FoodMealType
  texto: string
  itens: FoodItem[]
  createdAt: string
  /** ainda não subiu para a nuvem */
  pendente?: boolean
}

type RowItem = {
  posicao: number | null
  item_key: string
  nome: string
  quantidade: string | null
  kcal: number | string | null
  /** só existem depois da migração 077 */
  proteina?: number | string | null
  acucar?: number | string | null
  fontes?: string[] | null
  fonte: string | null
  barcode: string | null
}

type Row = {
  id: string
  data: string
  hora: string | null
  tipo: FoodMealType
  texto: string | null
  created_at: string
  refeicao_itens: RowItem[] | null
}

/**
 * Colunas da migração 077 (proteina, acucar, fontes). Começa otimista; se o servidor ainda não
 * tem, volta a ler e gravar sem elas nesta sessão e avisa uma vez no log.
 */
let nutrientColumns = true
let warned = false

/** Erro de coluna que não existe (Postgres 42703, cache do PostgREST PGRST204). */
export function isMissingColumnError(error: { code?: string; message?: string } | null | undefined): boolean
{
  if (!error) return false
  if (error.code === '42703' || error.code === 'PGRST204') return true
  return /column .* does not exist|could not find the .* column/i.test(error.message ?? '')
}

function disableNutrientColumns(): void
{
  nutrientColumns = false
  if (!warned)
  {
    warned = true
    console.warn('[refeicoes] servidor sem as colunas de proteína e açúcar (migração 077); seguindo só com kcal')
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

function fromRow(r: Row): Refeicao
{
  const itens = [...(r.refeicao_itens ?? [])]
    .sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0))
    .map((i) => ({
      key: i.item_key,
      nome: i.nome,
      quantidade: i.quantidade,
      kcal: i.kcal == null ? null : Number(i.kcal),
      // sem as colunas (antes da 077) fica ausente: o app sabe que ainda não perguntou
      ...('proteina' in i ? { proteina: numOrNull(i.proteina) } : {}),
      ...('acucar' in i ? { acucar: numOrNull(i.acucar) } : {}),
      ...(Array.isArray(i.fontes) && i.fontes.length ? { fontes: i.fontes.slice(0, 2) } : {}),
      fonte: i.fonte,
      barcode: i.barcode,
    }))
  return {
    id: r.id,
    data: r.data,
    hora: r.hora ? r.hora.slice(0, 5) : null,
    tipo: r.tipo,
    texto: r.texto ?? '',
    itens,
    createdAt: r.created_at,
  }
}

/** Refeições desde `sinceIso` (inclusive). null quando não há sessão ou a tabela não existe. */
export async function fetchRefeicoes(sinceIso: string): Promise<Refeicao[] | null>
{
  const user = await uid()
  if (!user) return null
  const cols = (withNutrients: boolean) => (withNutrients
    ? 'id, data, hora, tipo, texto, created_at, refeicao_itens(posicao, item_key, nome, quantidade, kcal, proteina, acucar, fontes, fonte, barcode)'
    : 'id, data, hora, tipo, texto, created_at, refeicao_itens(posicao, item_key, nome, quantidade, kcal, fonte, barcode)')
  const run = (withNutrients: boolean) => supabase
    .from('refeicoes')
    .select(cols(withNutrients))
    .eq('user_id', user)
    .gte('data', sinceIso)
    .order('data', { ascending: false })
    .order('hora', { ascending: false })
  let res = await run(nutrientColumns)
  if (res.error && nutrientColumns && isMissingColumnError(res.error))
  {
    disableNutrientColumns()
    res = await run(false)
  }
  if (res.error) return null
  return ((res.data ?? []) as unknown as Row[]).map(fromRow)
}

/** Grava a refeição (upsert pelo id) e troca os itens. */
export async function upsertRefeicao(r: Refeicao): Promise<boolean>
{
  const user = await uid()
  if (!user) return false
  const { error } = await supabase.from('refeicoes').upsert({
    id: r.id,
    user_id: user,
    data: r.data,
    hora: r.hora,
    tipo: r.tipo,
    texto: r.texto,
    created_at: r.createdAt,
  })
  if (error) return false
  const del = await supabase.from('refeicao_itens').delete().eq('refeicao_id', r.id)
  if (del.error) return false
  if (!r.itens.length) return true
  const rows = (withNutrients: boolean) => r.itens.map((i, posicao) => ({
    refeicao_id: r.id,
    posicao,
    item_key: i.key,
    nome: i.nome,
    quantidade: i.quantidade ?? null,
    kcal: i.kcal ?? null,
    ...(withNutrients
      ? { proteina: i.proteina ?? null, acucar: i.acucar ?? null, fontes: i.fontes?.length ? i.fontes.slice(0, 2) : null }
      : {}),
    fonte: i.fonte ?? null,
    barcode: i.barcode ?? null,
  }))
  let ins = await supabase.from('refeicao_itens').insert(rows(nutrientColumns))
  if (ins.error && nutrientColumns && isMissingColumnError(ins.error))
  {
    disableNutrientColumns()
    ins = await supabase.from('refeicao_itens').insert(rows(false))
  }
  return !ins.error
}

export async function deleteRefeicao(id: string): Promise<boolean>
{
  const user = await uid()
  if (!user) return false
  const { error } = await supabase.from('refeicoes').delete().eq('id', id).eq('user_id', user)
  return !error
}
