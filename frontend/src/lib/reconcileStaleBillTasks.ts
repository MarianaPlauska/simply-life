import type { FinanceBillSettlement, Transaction } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { supabase } from './supabase'
import { billIdFromTask, dismissBillForTask } from './financeBillOrchestrator'
import { isBillDismissed } from './financeBillDismiss'
import { hasPaidExpenseForBill } from './financeBillPayment'
import {
  billCanonicalKey,
  billTaskReferenceKey,
  isFinanceBillTask,
  parseBillAmountFromTitle,
  settlementCanonicalKey,
} from './financeBillTaskDedup'

/** Tarefa de boleto pendente que já foi resolvida noutra cópia, settlement ou ciclo */
export function findStaleBillTasks(
  tarefas: TarefaUnificada[],
  settlements: FinanceBillSettlement[] = [],
  transactions: Transaction[] = [],
): TarefaUnificada[]
{
  const completedKeys = new Set<string>()

  for (const row of settlements)
  {
    completedKeys.add(settlementCanonicalKey(row))
  }

  for (const t of tarefas)
  {
    if (t.status !== 'concluida') continue
    const canon = billCanonicalKey(t)
    if (canon) completedKeys.add(canon)
    const key = billTaskReferenceKey(t)
    if (key) completedKeys.add(key)
  }

  const stale: TarefaUnificada[] = []

  for (const t of tarefas)
  {
    if (!isFinanceBillTask(t)) continue

    const canon = billCanonicalKey(t)
    if (canon && completedKeys.has(canon))
    {
      stale.push(t)
      continue
    }

    const settleKey = settlementCanonicalKey({
      titulo: t.titulo,
      valor: 0,
    })
    if (completedKeys.has(settleKey))
    {
      stale.push(t)
      continue
    }

    const key = billTaskReferenceKey(t)
    if (key && completedKeys.has(key))
    {
      stale.push(t)
      continue
    }

    const billId = billIdFromTask(t)
    if (billId && isBillDismissed(billId))
    {
      stale.push(t)
      continue
    }

    if (t.status !== 'concluida' && transactions.length > 0)
    {
      const valor = parseBillAmountFromTitle(t.titulo)
      const monthKey = (t.data_vencimento ?? '').slice(0, 7)
        || new Date().toISOString().slice(0, 7)
      if (valor > 0 && hasPaidExpenseForBill(transactions, t.titulo, valor, monthKey))
      {
        stale.push(t)
      }
    }
  }

  return stale
}

/** Fecha no banco tarefas órfãs de boleto - sem XP nem novo registro de pagamento */
export async function reconcileStaleBillTasks(
  tarefas: TarefaUnificada[],
  patchLocal: (id: number, dados: Partial<TarefaUnificada>) => void,
  settlements: FinanceBillSettlement[] = [],
  transactions: Transaction[] = [],
): Promise<number>
{
  const stale = findStaleBillTasks(tarefas, settlements, transactions)
  if (stale.length === 0) return 0

  const { markNotificationsForCompletedTask } = await import('./notificationResolution')

  for (const t of stale)
  {
    dismissBillForTask(t)
    try
    {
      await supabase
        .from('tarefas_unificadas')
        .update({ status: 'concluida' })
        .eq('id', t.id)
    }
    catch { /* offline */ }

    patchLocal(t.id, { status: 'concluida' })
    await markNotificationsForCompletedTask({ ...t, status: 'concluida' })
  }

  return stale.length
}
