import { useEffect, useRef } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import {
  billTaskNotes,
  billTaskTitle,
  billPhantomKey,
  getUpcomingBills,
  isBillKanbanEligible,
  isBillResolvedForPeriod,
  taskMatchesBill,
} from '../lib/financeBillOrchestrator'
import { hasPendingBillTask } from '../lib/financeBillTaskDedup'

/** Sincroniza boletos/contas a vencer como tarefas no Kanban — hoje ou 1 dia antes */
export function useFinanceBillKanbanSync(enabled = true)
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const createFinanceBillTask = useTaskStore((s) => s.createFinanceBillTask)
  const syncingRef = useRef(false)
  const syncedBillIdsRef = useRef<Set<string>>(new Set())

  useEffect(() =>
  {
    if (!enabled || syncingRef.current) return

    const bills = getUpcomingBills({
      contasFixas,
      reservedBills,
      cards,
      transactions: useTaskStore.getState().transactions,
      settlements: useTaskStore.getState().billSettlements ?? [],
      windowDays: 7,
    }).filter((b) => isBillKanbanEligible(b))

    const pending = bills.filter((b) => !syncedBillIdsRef.current.has(b.id))
    if (pending.length === 0) return

    const run = async () =>
    {
      syncingRef.current = true
      try
      {
        for (const bill of pending)
        {
          const tarefas = useTaskStore.getState().tarefas
          const settlements = useTaskStore.getState().billSettlements ?? []
          const transactions = useTaskStore.getState().transactions
          if (isBillResolvedForPeriod(bill, tarefas, new Date(), { settlements, transactions }))
          {
            syncedBillIdsRef.current.add(bill.id)
            continue
          }

          const titulo = billTaskTitle(bill)
          const phantomKey = billPhantomKey(bill.id)
          const exists = hasPendingBillTask(tarefas, { titulo, phantomKey })
            || tarefas.some(
              (t) => t.status !== 'concluida'
                && taskMatchesBill(t.titulo, bill, t.snippet_100_char, t.notas_locais),
            )
          if (exists)
          {
            syncedBillIdsRef.current.add(bill.id)
            continue
          }

          await createFinanceBillTask({
            billId: bill.id,
            titulo,
            notas: billTaskNotes(bill),
            vencimento: bill.vencimento,
            diasRestantes: bill.diasRestantes,
          })
          syncedBillIdsRef.current.add(bill.id)
        }
      }
      finally
      {
        syncingRef.current = false
      }
    }

    void run()
  }, [enabled, contasFixas, reservedBills, cards, createFinanceBillTask])
}
