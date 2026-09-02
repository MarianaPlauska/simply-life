import { supabase } from '../supabase'
import type { FinanceCategory, FinanceTx } from '@simply-life/shared'

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

function mapCategoria(raw: string | null | undefined): FinanceCategory
{
  const k = (raw || 'outros').toLowerCase()
  if (CATEGORIES.has(k as FinanceCategory)) return k as FinanceCategory
  if (k.includes('comida') || k.includes('mercado') || k.includes('aliment')) return 'alimentacao'
  if (k.includes('uber') || k.includes('transp')) return 'transporte'
  if (k.includes('aluguel') || k.includes('moradia')) return 'habitacao'
  return 'outros'
}

function mapTx(row: Record<string, unknown>): FinanceTx
{
  const tipoRaw = String(row.tipo || 'despesa').toLowerCase()
  return {
    id: String(row.id),
    titulo: String(row.descricao || 'Lançamento'),
    valor: Number(row.valor) || 0,
    categoria: mapCategoria(row.categoria as string),
    data: String(row.data_gasto || '').slice(0, 10),
    tipo: tipoRaw === 'receita' ? 'receita' : 'despesa',
  }
}

export async function fetchDespesas(limit = 80): Promise<FinanceTx[]>
{
  const { data, error } = await supabase
    .from('despesas')
    .select('*')
    .order('data_gasto', { ascending: false })
    .limit(limit)

  if (error) throw new Error(error.message)
  return (data || []).map((r) => mapTx(r as Record<string, unknown>))
}

/** Parse rápido: "café 12,50" ou "12.5 uber" */
export function parseExpenseQuick(text: string): { titulo: string; valor: number } | null
{
  const t = text.trim()
  if (!t) return null
  const m = t.match(/(\d+[.,]?\d*)/)
  if (!m) return null
  const valor = Number(m[1].replace(',', '.'))
  if (!Number.isFinite(valor) || valor <= 0) return null
  const titulo = t.replace(m[0], '').trim() || 'Gasto'
  return { titulo, valor }
}

export async function addDespesa(input: {
  titulo: string
  valor: number
  categoria?: FinanceCategory
  data?: string
}): Promise<FinanceTx>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const dataGasto = input.data || new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('despesas')
    .insert({
      user_id: uid,
      descricao: input.titulo.trim(),
      valor: input.valor,
      categoria: input.categoria || 'outros',
      data_gasto: dataGasto,
      tipo: 'despesa',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapTx(data as Record<string, unknown>)
}
