import type { FinanceBillSettlement } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import type { ReservedBill, Transaction } from '../store/storeTypes'
import { supabase } from './supabase'
import { dismissBillForTask } from './financeBillOrchestrator'
import {
  billCanonicalKey,
  settlementCanonicalKey,
} from './financeBillTaskDedup'
import { payablesDedupKey } from './financePayablesDedup'
import { reconcileStaleBillTasks } from './reconcileStaleBillTasks'
import {
  ledgerEntryDedupKey,
  normalizeTxDescription,
  transactionBusinessKey,
} from './financeTransactionDedup'

const DELETE_CHUNK = 40

async function deleteDespesasByIds(uid: string, ids: number[]): Promise<number>
{
  if (ids.length === 0) return 0

  let deleted = 0
  for (let i = 0; i < ids.length; i += DELETE_CHUNK)
  {
    const chunk = ids.slice(i, i + DELETE_CHUNK)
    const { error } = await supabase
      .from('despesas')
      .delete()
      .in('id', chunk)
      .eq('user_id', uid)

    if (error)
    {
      console.error('deleteDespesasByIds:', error)
      break
    }
    deleted += chunk.length
  }

  return deleted
}

function mapRemoteTransaction(row: Record<string, unknown>): Transaction
{
  const cardMatch = String(row.descricao ?? '').match(/\[card:(card_\d+)\]/)
  const card_id = row.card_id
    ? String(row.card_id)
    : (cardMatch ? cardMatch[1] : undefined)

  return {
    id: Number(row.id),
    descricao: normalizeTxDescription(String(row.descricao ?? '')),
    valor: Number(row.valor ?? 0),
    data: String(row.data_gasto ?? '').slice(0, 10),
    tipo: row.tipo === 'receita' ? 'receita' : 'despesa',
    categoria: '',
    status_pagamento: (row.status_pagamento as Transaction['status_pagamento']) ?? 'pendente',
    card_id,
  }
}

/** Boleto ou reserva já consta em Pagos */
export function isPaidInSettlements(
  titulo: string,
  valor: number,
  settlements: FinanceBillSettlement[],
): boolean
{
  const key = settlementCanonicalKey({ titulo, valor })
  return settlements.some((s) => settlementCanonicalKey(s) === key)
}

/** Remove lançamentos duplicados no Supabase — mantém o mais antigo por chave */
export async function dedupeDuplicateTransactionsRemote(): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const { data, error } = await supabase
    .from('despesas')
    .select('id, descricao, valor, data_gasto, tipo, status_pagamento, card_id')
    .eq('user_id', uid)
    .order('id', { ascending: true })

  if (error || !data?.length) return 0

  const keepers = new Map<string, number>()
  const keeperRows = new Map<string, Transaction>()
  const toDelete: number[] = []

  for (const row of data)
  {
    const tx = mapRemoteTransaction(row as Record<string, unknown>)
    const key = transactionBusinessKey(tx)
    const prevId = keepers.get(key)
    if (prevId == null)
    {
      keepers.set(key, tx.id)
      keeperRows.set(key, tx)
      continue
    }

    const prev = keeperRows.get(key)!
    const prevStatus = prev.status_pagamento ?? 'pendente'
    const nextStatus = tx.status_pagamento ?? 'pendente'
    const preferNext = (
      (nextStatus === 'pago' && prevStatus !== 'pago')
      || (nextStatus === prevStatus && tx.id < prevId)
    )

    if (preferNext)
    {
      toDelete.push(prevId)
      keepers.set(key, tx.id)
      keeperRows.set(key, tx)
    }
    else
    {
      toDelete.push(tx.id)
    }
  }

  if (toDelete.length === 0) return 0
  return deleteDespesasByIds(uid, toDelete)
}

/** Remove pagos duplicados no mesmo dia (ex.: vários Eric R$ 10 no mesmo dia) */
export async function dedupeDuplicatePaidByDayRemote(): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const { data, error } = await supabase
    .from('despesas')
    .select('id, descricao, valor, data_gasto, tipo, status_pagamento, card_id')
    .eq('user_id', uid)
    .eq('status_pagamento', 'pago')
    .order('id', { ascending: true })

  if (error || !data?.length) return 0

  const keepers = new Map<string, number>()
  const toDelete: number[] = []

  for (const row of data)
  {
    const tx = mapRemoteTransaction(row as Record<string, unknown>)
    if (tx.card_id && tx.tipo === 'despesa') continue

    const key = ledgerEntryDedupKey(tx)
    const prevId = keepers.get(key)
    if (prevId == null)
    {
      keepers.set(key, tx.id)
      continue
    }
    toDelete.push(tx.id)
  }

  if (toDelete.length === 0) return 0
  return deleteDespesasByIds(uid, toDelete)
}

/** Marca reservas abertas como quitadas quando já pagas no histórico */
export async function reconcilePaidReservedBills(
  bills: ReservedBill[],
  settlements: FinanceBillSettlement[],
): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  let closed = 0

  for (const bill of bills)
  {
    if (bill.status !== 'aberta') continue
    if (!isPaidInSettlements(bill.titulo, bill.valor_alocado, settlements)) continue

    await supabase
      .from('fin_faturas_reservas')
      .update({
        status: 'quitada',
        valor_gasto: bill.valor_alocado,
      })
      .eq('id', bill.id)
      .eq('user_id', uid)

    closed += 1
  }

  return closed
}

/** Remove settlements duplicados no Supabase — mantém o mais recente por boleto */
export async function dedupeBillSettlementsRemote(): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const { data, error } = await supabase
    .from('finance_bill_settlements')
    .select('*')
    .eq('user_id', uid)
    .order('pago_em', { ascending: false })

  if (error || !data?.length) return 0

  const keepers = new Map<string, number>()
  const toDelete: number[] = []

  for (const row of data)
  {
    const titulo = String(row.titulo ?? '')
    const valor = Number(row.valor ?? 0)
    const key = settlementCanonicalKey({ titulo, valor })
    if (!keepers.has(key))
    {
      keepers.set(key, Number(row.id))
      continue
    }
    toDelete.push(Number(row.id))
  }

  if (toDelete.length === 0) return 0

  const { error: delError } = await supabase
    .from('finance_bill_settlements')
    .delete()
    .in('id', toDelete)
    .eq('user_id', uid)

  if (delError)
  {
    console.error('dedupeBillSettlementsRemote:', delError)
    return 0
  }

  return toDelete.length
}

/** Remove pendentes duplicados — mantém o de menor id */
export async function reconcilePendingBillTransactions(
  transactions: Transaction[],
): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const pending = transactions.filter((t) =>
  {
    const status = t.status_pagamento ?? 'pendente'
    return t.tipo === 'despesa' && (status === 'pendente' || status === 'agendado')
  })

  const groups = new Map<string, Transaction[]>()
  for (const t of pending)
  {
    const key = payablesDedupKey({
      kind: (t.status_pagamento === 'agendado' ? 'agendado' : 'pendente'),
      label: normalizeTxDescription(t.descricao),
      valor: t.valor,
      dueDate: t.data.slice(0, 10),
    })
    const list = groups.get(key) ?? []
    list.push(t)
    groups.set(key, list)
  }

  const toDelete: number[] = []
  for (const list of groups.values())
  {
    if (list.length <= 1) continue
    const sorted = [...list].sort((a, b) => a.id - b.id)
    toDelete.push(...sorted.slice(1).map((t) => t.id))
  }

  if (toDelete.length === 0) return 0
  return deleteDespesasByIds(uid, toDelete)
}

export interface FinanceLedgerReconcileInput
{
  tarefas: TarefaUnificada[]
  transactions: Transaction[]
  reservedBills: ReservedBill[]
  patchTarefaLocal: (id: number, dados: Partial<TarefaUnificada>) => void
  settlements: FinanceBillSettlement[]
}

export interface FinanceLedgerReconcileResult
{
  staleTasksClosed: number
  settlementsDeduped: number
  pendingTxClosed: number
  pendingDuplicatesRemoved: number
  transactionsDeduped: number
  paidByDayDeduped: number
  reservedBillsClosed: number
}

/** Remove pendentes duplicados quando o mesmo boleto já está pago no mês */
export async function removePendingDuplicatesWhenPaid(
  transactions: Transaction[],
): Promise<number>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const paidKeys = new Set<string>()
  for (const t of transactions)
  {
    if (t.tipo !== 'despesa') continue
    if ((t.status_pagamento ?? 'pendente') !== 'pago') continue
    const month = t.data.slice(0, 7)
    const canon = settlementCanonicalKey({
      titulo: normalizeTxDescription(t.descricao),
      valor: t.valor,
    })
    const channel = t.card_id ? `card:${t.card_id}` : 'cash'
    paidKeys.add(`${month}|${canon}|${channel}`)
  }

  const toDelete: number[] = []
  for (const t of transactions)
  {
    const status = t.status_pagamento ?? 'pendente'
    if (status !== 'pendente' && status !== 'agendado') continue
    if (t.tipo !== 'despesa') continue
    const month = t.data.slice(0, 7)
    const canon = settlementCanonicalKey({
      titulo: normalizeTxDescription(t.descricao),
      valor: t.valor,
    })
    const channel = t.card_id ? `card:${t.card_id}` : 'cash'
    if (paidKeys.has(`${month}|${canon}|${channel}`))
    {
      toDelete.push(t.id)
    }
  }

  if (toDelete.length === 0) return 0
  return deleteDespesasByIds(uid, toDelete)
}


/** Limpeza profunda — tarefas órfãs, duplicatas e lançamentos de pagamento faltantes */
export async function reconcileFinanceLedger(
  input: FinanceLedgerReconcileInput,
): Promise<FinanceLedgerReconcileResult>
{
  const staleTasksClosed = await reconcileStaleBillTasks(
    input.tarefas,
    input.patchTarefaLocal,
    input.settlements,
    input.transactions,
  )

  const settlementsDeduped = await dedupeBillSettlementsRemote()
  const transactionsDeduped = await dedupeDuplicateTransactionsRemote()
  const paidByDayDeduped = await dedupeDuplicatePaidByDayRemote()
  const pendingTxClosed = await reconcilePendingBillTransactions(input.transactions)
  const pendingDuplicatesRemoved = await removePendingDuplicatesWhenPaid(input.transactions)

  const { fetchBillSettlements } = await import('./financeBillSettlement')
  const freshSettlements = await fetchBillSettlements(200)
  const reservedBillsClosed = await reconcilePaidReservedBills(
    input.reservedBills,
    freshSettlements,
  )

  for (const t of input.tarefas)
  {
    if (t.status !== 'concluida') continue
    if (!billCanonicalKey(t)) continue
    dismissBillForTask(t)
  }

  return {
    staleTasksClosed,
    settlementsDeduped,
    pendingTxClosed,
    pendingDuplicatesRemoved,
    transactionsDeduped,
    paidByDayDeduped,
    reservedBillsClosed,
  }
}
