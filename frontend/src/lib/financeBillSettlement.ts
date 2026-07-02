import type { FinanceBillSettlement } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import type { Transaction } from '../store/storeTypes'
import { supabase } from './supabase'
import { billIdFromTask } from './financeBillOrchestrator'
import {
  billCanonicalKey,
  billTaskReferenceKey,
  parseBillAmountFromTitle,
  settlementCanonicalKey,
} from './financeBillTaskDedup'
import { payablesDedupKey } from './financePayablesDedup'

function mapSettlement(row: Record<string, unknown>): FinanceBillSettlement
{
  return {
    id: Number(row.id),
    tarefa_id: row.tarefa_id != null ? Number(row.tarefa_id) : null,
    bill_id: row.bill_id ? String(row.bill_id) : null,
    titulo: String(row.titulo ?? ''),
    valor: Number(row.valor ?? 0),
    pago_em: String(row.pago_em ?? row.created_at ?? new Date().toISOString()),
    origem: String(row.origem ?? 'kanban'),
    notas: row.notas ? String(row.notas) : null,
  }
}

export async function fetchBillSettlements(limit = 40): Promise<FinanceBillSettlement[]>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []

  const { data, error } = await supabase
    .from('finance_bill_settlements')
    .select('*')
    .eq('user_id', uid)
    .order('pago_em', { ascending: false })
    .limit(limit)

  if (error)
  {
    if (error.code === '42P01' || error.code === 'PGRST205')
    {
      return []
    }
    console.error('fetchBillSettlements:', error)
    return []
  }

  return (data ?? []).map((row) => mapSettlement(row as Record<string, unknown>))
    .filter((row, idx, arr) =>
    {
      const key = settlementCanonicalKey(row)
      return arr.findIndex((r) => settlementCanonicalKey(r) === key) === idx
    })
}

/** Registra pagamento permanente ao concluir tarefa de boleto no Kanban */
export async function recordBillSettlementFromTask(tarefa: TarefaUnificada): Promise<void>
{
  const refKey = billTaskReferenceKey(tarefa)
  const titulo = tarefa.titulo.trim()
  if (!refKey && !titulo.toLowerCase().includes('boleto') && tarefa.origem !== 'financeiro')
  {
    return
  }

  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid || tarefa.id <= 0) return

  const valor = parseBillAmountFromTitle(titulo)
  const canonId = `settle:${settlementCanonicalKey({ titulo, valor })}`

  const { data: existing } = await supabase
    .from('finance_bill_settlements')
    .select('id')
    .eq('user_id', uid)
    .eq('bill_id', canonId)
    .maybeSingle()

  if (existing?.id) return

  const billId = billIdFromTask(tarefa) ?? canonId
  const pagoEm = new Date().toISOString()

  const payload = {
    user_id: uid,
    tarefa_id: tarefa.id,
    bill_id: billId,
    titulo,
    valor,
    pago_em: pagoEm,
    origem: 'kanban',
    notas: tarefa.notas_locais ?? null,
  }

  const { error } = await supabase.from('finance_bill_settlements').insert(payload)
  if (error)
  {
    if (error.code === '42P01' || error.code === 'PGRST205')
    {
      return
    }
    console.error('recordBillSettlementFromTask:', error)
  }
}

function txDedupProbe(tx: Transaction)
{
  const dueDate = tx.data.slice(0, 10)
  return payablesDedupKey({
    kind: tx.status_pagamento === 'agendado' ? 'agendado' : 'pendente',
    label: tx.descricao,
    valor: tx.valor,
    dueDate,
  })
}

/** Registra pagamento ao marcar despesa como paga em Finanças */
export async function recordBillSettlementFromTransaction(
  tx: Transaction,
  origem: 'financeiro' | 'kanban' = 'financeiro',
): Promise<void>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid || tx.id <= 0) return

  const dedupKey = txDedupProbe(tx)
  const { data: existing } = await supabase
    .from('finance_bill_settlements')
    .select('id')
    .eq('user_id', uid)
    .eq('bill_id', `tx:${dedupKey}`)
    .maybeSingle()

  if (existing?.id) return

  const payload = {
    user_id: uid,
    tarefa_id: null,
    bill_id: `tx:${dedupKey}`,
    titulo: tx.descricao,
    valor: tx.valor,
    pago_em: new Date().toISOString(),
    origem,
    notas: tx.observacao ?? null,
  }

  const { error } = await supabase.from('finance_bill_settlements').insert(payload)
  if (error && error.code !== '42P01' && error.code !== 'PGRST205')
  {
    console.error('recordBillSettlementFromTransaction:', error)
  }
}

/** Preenche histórico a partir de tarefas de boleto já concluídas (uma vez) */
export async function backfillBillSettlementsFromTasks(tarefas: TarefaUnificada[]): Promise<void>
{
  for (const t of tarefas)
  {
    if (t.status !== 'concluida') continue
    if (!billCanonicalKey(t) && !t.titulo.toLowerCase().includes('boleto')) continue
    await recordBillSettlementFromTask(t)
  }
}
