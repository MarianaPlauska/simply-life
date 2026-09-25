import { supabase } from '../supabase'
import {
  FINANCE_CATEGORY_LABELS,
  type FinanceCategory,
  type FinanceEscopo,
  type FinancePaymentMethod,
  type FinanceTx,
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
    fixaId: row.fixa_id ? String(row.fixa_id) : undefined,
    grupoParcela: row.grupo_parcela ? String(row.grupo_parcela) : undefined,
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
  /** importação: impressão digital da linha, para não duplicar (migração 060) */
  importHash?: string
  /** gasto lançado a partir de uma conta fixa (migração 061) */
  fixaId?: number
  /** parcelas da mesma compra (migração 061) */
  grupoParcela?: string
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

  // orçamento soma por categoria_id: sem isso o gasto não aparecia no limite da categoria
  const categoriaId = await resolveCategoriaId(String(payload.categoria), tipo).catch(() => null)
  if (categoriaId) payload.categoria_id = categoriaId
  if (input.importHash) payload.import_hash = input.importHash
  if (input.fixaId) payload.fixa_id = input.fixaId
  if (input.grupoParcela) payload.grupo_parcela = input.grupoParcela

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
  // migração 060 pendente: tenta de novo sem as colunas novas
  if (error && /import_hash|categoria_id|fixa_id|grupo_parcela/i.test(error.message))
  {
    delete payload.import_hash
    delete payload.categoria_id
    delete payload.fixa_id
    delete payload.grupo_parcela
    const retry = await supabase.from('despesas').insert(payload).select().single()
    data = retry.data
    error = retry.error
  }
  if (error && (error as { code?: string }).code === '23505' && input.importHash)
  {
    throw new DuplicateImportError()
  }

  if (error) throw new Error(error.message)
  const mapped = mapTx(data as Record<string, unknown>)
  if (input.folderId && !mapped.folderId)
  {
    return { ...mapped, folderId: input.folderId }
  }
  return mapped
}

/** Linha de importação que já existe (mesmo import_hash). */
export class DuplicateImportError extends Error
{
  constructor()
  {
    super('Lançamento já importado')
    this.name = 'DuplicateImportError'
  }
}

// ---------------------------------------------------------------------------
// Categoria do app ('alimentacao', 'c-pet'...) → fin_categorias.id (por slug).
// Cria a linha na primeira vez. Cache por sessão para não consultar a cada gasto.
// ---------------------------------------------------------------------------

const categoriaCache = new Map<string, number>()

function labelForSlug(slug: string): string
{
  const builtin = FINANCE_CATEGORY_LABELS[slug as FinanceCategory]
  if (builtin) return builtin
  const base = slug.replace(/^c-/, '').replace(/-/g, ' ').trim()
  return base ? base.charAt(0).toUpperCase() + base.slice(1) : 'Outros'
}

export async function resolveCategoriaId(slug: string, tipo: 'despesa' | 'receita' = 'despesa', label?: string): Promise<number | null>
{
  const key = `${tipo}|${slug}`
  const cached = categoriaCache.get(key)
  if (cached) return cached
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return null

  const found = await supabase
    .from('fin_categorias')
    .select('id')
    .eq('user_id', uid)
    .eq('slug', slug)
    .maybeSingle()
  if (found.error) return null // coluna slug ausente (060 pendente)
  if (found.data?.id)
  {
    categoriaCache.set(key, Number(found.data.id))
    return Number(found.data.id)
  }

  const created = await supabase
    .from('fin_categorias')
    .insert({ user_id: uid, slug, nome: (label || labelForSlug(slug)).slice(0, 50), tipo })
    .select('id')
    .single()
  if (created.error || !created.data) return null
  categoriaCache.set(key, Number(created.data.id))
  return Number(created.data.id)
}

// ---------------------------------------------------------------------------
// Editar e apagar lançamentos (antes só dava para inserir).
// ---------------------------------------------------------------------------

export type DespesaPatch = Partial<Pick<FinanceTx, 'titulo' | 'valor' | 'categoria' | 'data' | 'tipo'>>

export async function updateDespesa(id: string, patch: DespesaPatch): Promise<void>
{
  const payload: Record<string, unknown> = {}
  if (patch.titulo != null) payload.descricao = patch.titulo.trim()
  if (patch.valor != null) payload.valor = patch.valor
  if (patch.data != null) payload.data_gasto = patch.data
  if (patch.tipo != null) payload.tipo = patch.tipo
  if (patch.categoria != null)
  {
    payload.categoria = patch.categoria
    const catId = await resolveCategoriaId(patch.categoria, patch.tipo ?? 'despesa').catch(() => null)
    if (catId) payload.categoria_id = catId
  }
  let { error } = await supabase.from('despesas').update(payload).eq('id', id)
  if (error && /categoria_id/i.test(error.message))
  {
    delete payload.categoria_id
    ;({ error } = await supabase.from('despesas').update(payload).eq('id', id))
  }
  if (error) throw new Error(error.message)
}

/** Apaga vários de uma vez (ex.: parcelas de uma compra). */
export async function deleteDespesas(ids: string[]): Promise<void>
{
  const numeric = ids.filter((id) => /^\d+$/.test(id)).map(Number)
  if (!numeric.length) return
  const { error } = await supabase.from('despesas').delete().in('id', numeric)
  if (error) throw new Error(error.message)
}

export async function deleteDespesa(id: string): Promise<void>
{
  const { error } = await supabase.from('despesas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
