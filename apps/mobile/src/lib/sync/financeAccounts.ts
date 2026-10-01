import { supabase } from '../supabase'
import { resolveCategoriaId } from './finance'
import type { CashAccount, ContaAPagar, ContaFixa, FinanceCard, FinanceCardGradient, FinanceGoal } from '@simply-life/shared'

export async function fetchCashAccount(): Promise<CashAccount>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return { saldoInicial: 0 }

  const { data, error } = await supabase
    .from('fin_conta_corrente')
    .select('saldo_inicial')
    .eq('user_id', uid)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return { saldoInicial: Number(data?.saldo_inicial) || 0 }
}

/** Grava o saldo inicial da conta corrente (a tabela tem uma linha por usuário). */
export async function upsertCashAccount(saldoInicial: number): Promise<void>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')
  const { error } = await supabase
    .from('fin_conta_corrente')
    .upsert({ user_id: uid, saldo_inicial: saldoInicial, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw new Error(error.message)
}

export async function fetchFinanceCards(): Promise<FinanceCard[]>
{
  const { data, error } = await supabase
    .from('fin_cartoes')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) =>
  {
    const r = row as Record<string, unknown>
    const gradRaw = String(r.tipo_gradiente || 'copper')
    const gradients = new Set(['purple', 'obsidian', 'sunset', 'ocean', 'mint', 'copper', 'wine', 'green', 'blue', 'violet', 'rose'])
    const tipoGradiente: FinanceCardGradient = gradients.has(gradRaw)
      ? (gradRaw as FinanceCardGradient)
      : 'copper'
    const numero = String(r.numero || '')
    return {
      id: String(r.id),
      nome: String(r.nome || 'Cartão'),
      limite: Number(r.limite) || 0,
      diaVencimento: Number(r.dia_vencimento) || 1,
      status: r.status === 'bloqueado' ? 'bloqueado' : 'ativo',
      bandeira: r.bandeira === 'visa' ? 'visa' : 'mastercard',
      tipoGradiente,
      numeroMascarado: numero ? `•••• ${numero.slice(-4)}` : undefined,
      titular: r.titular ? String(r.titular) : undefined,
      banco: r.banco ? String(r.banco) : undefined,
    }
  })
}

export async function fetchContasFixas(): Promise<ContaFixa[]>
{
  const { data, error } = await supabase
    .from('fin_contas_fixas')
    .select('*')
    .order('dia_vencimento', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((row) =>
  {
    const r = row as Record<string, unknown>
    return {
      id: Number(r.id),
      nome: String(r.nome || 'Conta'),
      valor: Number(r.valor) || 0,
      diaVencimento: Number(r.dia_vencimento) || 1,
      categoria: String(r.categoria || 'outros'),
      ativa: r.ativa !== false,
    }
  })
}

export async function insertContaFixa(input: {
  nome: string
  valor: number
  diaVencimento?: number
  categoria?: string
}): Promise<ContaFixa>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const dia = input.diaVencimento ?? new Date().getDate()
  const { data, error } = await supabase
    .from('fin_contas_fixas')
    .insert({
      user_id: uid,
      nome: input.nome.trim(),
      valor: input.valor,
      dia_vencimento: dia,
      categoria: input.categoria || 'outros',
      ativa: true,
    })
    .select('*')
    .single()

  if (error) throw new Error(error.message)
  const r = data as Record<string, unknown>
  return {
    id: Number(r.id),
    nome: String(r.nome || input.nome),
    valor: Number(r.valor) || input.valor,
    diaVencimento: Number(r.dia_vencimento) || dia,
    categoria: String(r.categoria || 'outros'),
    ativa: true,
  }
}

export async function updateContaFixa(
  id: number,
  patch: {
    nome?: string
    valor?: number
    diaVencimento?: number
    categoria?: string
    ativa?: boolean
  },
): Promise<void>
{
  const payload: Record<string, unknown> = {}
  if (patch.nome != null) payload.nome = patch.nome.trim()
  if (patch.valor != null) payload.valor = patch.valor
  if (patch.diaVencimento != null) payload.dia_vencimento = patch.diaVencimento
  if (patch.categoria != null) payload.categoria = patch.categoria
  if (patch.ativa != null) payload.ativa = patch.ativa

  const { error } = await supabase
    .from('fin_contas_fixas')
    .update(payload)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function fetchContasAPagar(): Promise<ContaAPagar[]>
{
  const { data, error } = await supabase
    .from('fin_faturas_reservas')
    .select('id, titulo, valor_alocado, data_vencimento, status')
    .order('data_vencimento', { ascending: true })
    .limit(40)

  if (error)
  {
    // Tabela pode não existir em ambientes antigos
    return []
  }

  return (data || []).map((row) =>
  {
    const r = row as Record<string, unknown>
    const statusRaw = String(r.status || 'aberta')
    return {
      id: Number(r.id),
      titulo: String(r.titulo || 'Conta'),
      valor: Number(r.valor_alocado) || 0,
      vencimento: String(r.data_vencimento || '').slice(0, 10),
      status: statusRaw === 'quitada' || statusRaw === 'paga' ? 'paga' : 'aberta',
    }
  })
}

/** Nova conta "a pagar" (mesma tabela que o Kanban e o Foco do dia leem). */
export async function insertContaAPagar(input: {
  titulo: string
  valor: number
  vencimento: string
  categoria?: string | null
}): Promise<ContaAPagar>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Sessão expirada')

  const titulo = input.titulo.trim().slice(0, 120) || 'Conta'
  // a tabela guarda o id da categoria; sem categoria conhecida a conta entra sem ela
  const categoriaId = input.categoria
    ? await resolveCategoriaId(input.categoria, 'despesa').catch(() => null)
    : null
  const { data, error } = await supabase
    .from('fin_faturas_reservas')
    .insert({
      user_id: uid,
      titulo,
      valor_alocado: input.valor,
      valor_gasto: 0,
      data_vencimento: input.vencimento.slice(0, 10),
      status: 'aberta',
      ...(categoriaId ? { categoria_id: categoriaId } : {}),
    })
    .select('id, titulo, valor_alocado, data_vencimento, status')
    .single()

  if (error) throw new Error(error.message)
  const r = data as Record<string, unknown>
  return {
    id: Number(r.id),
    titulo: String(r.titulo || titulo),
    valor: Number(r.valor_alocado) || input.valor,
    vencimento: String(r.data_vencimento || input.vencimento).slice(0, 10),
    status: 'aberta',
  }
}

export async function updateContaAPagarStatus(id: number, paga: boolean): Promise<void>
{
  const { error } = await supabase
    .from('fin_faturas_reservas')
    .update({ status: paga ? 'quitada' : 'aberta' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Cartões (Etapa 1 de integridade): antes só existiam na tela e sumiam ao reabrir.
// Segurança: só os 4 últimos dígitos vão para o banco. Nunca número completo nem CVV.
// A fatura aberta NÃO é salva: é recalculada das compras do cartão (cardFaturaAbertaDisplay).
// ---------------------------------------------------------------------------

function lastFour(masked: string | undefined): string | null
{
  const digits = (masked || '').replace(/\D/g, '')
  return digits ? digits.slice(-4) : null
}

function cardRow(card: FinanceCard): Record<string, unknown>
{
  return {
    nome: card.nome,
    titular: card.titular || card.nome || 'Titular',
    numero: lastFour(card.numeroMascarado),
    limite: card.limite,
    dia_vencimento: card.diaVencimento,
    status: card.status,
    bandeira: card.bandeira,
    tipo_gradiente: card.tipoGradiente ?? 'copper',
    banco: card.banco ?? null,
  }
}

export async function insertFinanceCard(card: FinanceCard): Promise<void>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')
  const { error } = await supabase.from('fin_cartoes').insert({ id: card.id, user_id: uid, ...cardRow(card) })
  if (error) throw new Error(error.message)
}

export async function updateFinanceCardRow(card: FinanceCard): Promise<void>
{
  const { error } = await supabase.from('fin_cartoes').update(cardRow(card)).eq('id', card.id)
  if (error) throw new Error(error.message)
}

export async function deleteFinanceCard(cardId: string): Promise<void>
{
  const { error } = await supabase.from('fin_cartoes').delete().eq('id', cardId)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Metas (fin_metas): antes eram só locais e o "atual" ficava sempre em 0.
// ---------------------------------------------------------------------------

export async function fetchFinanceGoals(): Promise<FinanceGoal[]>
{
  const { data, error } = await supabase
    .from('fin_metas')
    .select('id, titulo, valor_alvo, valor_atual, concluida')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return (data || []).map((r) => ({
    id: Number(r.id),
    titulo: String(r.titulo || 'Meta'),
    meta: Number(r.valor_alvo) || 0,
    atual: Number(r.valor_atual) || 0,
  }))
}

export async function insertFinanceGoal(titulo: string, meta: number): Promise<FinanceGoal>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('fin_metas')
    .insert({ user_id: uid, titulo, valor_alvo: meta, valor_atual: 0 })
    .select('id, titulo, valor_alvo, valor_atual')
    .single()
  if (error) throw new Error(error.message)
  return { id: Number(data.id), titulo: String(data.titulo), meta: Number(data.valor_alvo) || 0, atual: Number(data.valor_atual) || 0 }
}

export async function updateFinanceGoalRow(goal: FinanceGoal): Promise<void>
{
  const { error } = await supabase
    .from('fin_metas')
    .update({ titulo: goal.titulo, valor_alvo: goal.meta, valor_atual: goal.atual, concluida: goal.atual >= goal.meta })
    .eq('id', goal.id)
  if (error) throw new Error(error.message)
}

export async function deleteFinanceGoal(id: number): Promise<void>
{
  const { error } = await supabase.from('fin_metas').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
