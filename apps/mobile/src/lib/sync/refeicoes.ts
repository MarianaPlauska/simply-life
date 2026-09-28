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
  const { data, error } = await supabase
    .from('refeicoes')
    .select('id, data, hora, tipo, texto, created_at, refeicao_itens(posicao, item_key, nome, quantidade, kcal, fonte, barcode)')
    .eq('user_id', user)
    .gte('data', sinceIso)
    .order('data', { ascending: false })
    .order('hora', { ascending: false })
  if (error) return null
  return ((data ?? []) as unknown as Row[]).map(fromRow)
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
  const ins = await supabase.from('refeicao_itens').insert(
    r.itens.map((i, posicao) => ({
      refeicao_id: r.id,
      posicao,
      item_key: i.key,
      nome: i.nome,
      quantidade: i.quantidade ?? null,
      kcal: i.kcal ?? null,
      fonte: i.fonte ?? null,
      barcode: i.barcode ?? null,
    })),
  )
  return !ins.error
}

export async function deleteRefeicao(id: string): Promise<boolean>
{
  const user = await uid()
  if (!user) return false
  const { error } = await supabase.from('refeicoes').delete().eq('id', id).eq('user_id', user)
  return !error
}
