import { supabase } from '../supabase'
import type {
  FinanceCategory,
  FinanceEscopo,
  FinancePaymentMethod,
  FinanceTx,
} from '@simply-life/shared'

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
  if (k.startsWith('c-')) return k
  if (k.includes('comida') || k.includes('mercado') || k.includes('aliment')) return 'alimentacao'
  if (k.includes('uber') || k.includes('transp')) return 'transporte'
  if (k.includes('aluguel') || k.includes('moradia')) return 'habitacao'
  return 'outros'
}

const FORMAS = new Set<FinancePaymentMethod>([
  'pix',
  'debito',
  'dinheiro',
  'boleto',
  'cartao',
  'ted',
  'outro',
])

function mapForma(raw: unknown): FinancePaymentMethod | undefined
{
  const k = String(raw || '').toLowerCase()
  if (FORMAS.has(k as FinancePaymentMethod)) return k as FinancePaymentMethod
  return undefined
}

function mapTx(row: Record<string, unknown>): FinanceTx
{
  const tipoRaw = String(row.tipo || 'despesa').toLowerCase()
  const compartilhada = Boolean(row.compartilhada)
  const pagoContaCasal = Boolean(row.pago_conta_casal)
  const escopo: FinanceEscopo = compartilhada ? 'casal' : 'pessoal'
  const cardId = row.card_id ? String(row.card_id) : undefined
  return {
    id: String(row.id),
    titulo: String(row.descricao || 'Lançamento'),
    valor: Number(row.valor) || 0,
    categoria: mapCategoria(row.categoria as string),
    data: String(row.data_gasto || '').slice(0, 10),
    tipo: tipoRaw === 'receita' ? 'receita' : 'despesa',
    cardId,
    formaPagamento: mapForma(row.forma_pagamento) ?? (cardId ? 'cartao' : undefined),
    folderId: row.pasta_id ? String(row.pasta_id) : undefined,
    escopo,
    pagoContaCasal,
  }
}

export async function fetchDespesas(limit = 240): Promise<FinanceTx[]>
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
  tipo?: 'despesa' | 'receita'
  formaPagamento?: FinancePaymentMethod
  cardId?: string
  folderId?: string
  escopo?: FinanceEscopo
  pagoContaCasal?: boolean
  partnerWorkspaceId?: string | null
}): Promise<FinanceTx>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const dataGasto = input.data || new Date().toISOString().slice(0, 10)
  const compartilhada = input.escopo === 'casal'
  const tipo = input.tipo === 'receita' ? 'receita' : 'despesa'
  const payload: Record<string, unknown> = {
    user_id: uid,
    descricao: input.titulo.trim(),
    valor: input.valor,
    categoria: input.categoria || (tipo === 'receita' ? 'outros' : 'outros'),
    data_gasto: dataGasto,
    tipo,
  }

  if (input.cardId) payload.card_id = input.cardId
  if (input.folderId) payload.pasta_id = input.folderId
  if (input.formaPagamento) payload.forma_pagamento = input.formaPagamento
  else if (input.cardId) payload.forma_pagamento = 'cartao'

  if (compartilhada)
  {
    payload.compartilhada = true
    if (input.partnerWorkspaceId) payload.partner_workspace_id = input.partnerWorkspaceId
  }
  else if (input.pagoContaCasal)
  {
    payload.pago_conta_casal = true
    if (input.partnerWorkspaceId) payload.partner_workspace_id = input.partnerWorkspaceId
  }

  let { data, error } = await supabase.from('despesas').insert(payload).select().single()
  if (error && input.folderId && /pasta_id/i.test(error.message))
  {
    delete payload.pasta_id
    const retry = await supabase.from('despesas').insert(payload).select().single()
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(error.message)
  const mapped = mapTx(data as Record<string, unknown>)
  if (input.folderId && !mapped.folderId)
  {
    return { ...mapped, folderId: input.folderId }
  }
  return mapped
}
