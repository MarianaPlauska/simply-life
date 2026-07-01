import { useEffect, useRef } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import {
  billTaskNotes,
  billTaskTitle,
  getUpcomingBills,
  isBillKanbanEligible,
  taskMatchesBill,
} from '../lib/financeBillOrchestrator'

/** Sincroniza boletos/contas a vencer como tarefas no Kanban — hoje ou 1 dia antes */
export function useFinanceBillKanbanSync(enabled = true)
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)
  const createFinanceBillTask = useTaskStore((s) => s.createFinanceBillTask)
  const syncingRef = useRef(false)

  useEffect(() =>
  {
    if (!enabled || syncingRef.current) return

    const bills = getUpcomingBills({
      contasFixas,
      reservedBills,
      cards,
      transactions,
      windowDays: 7,
    }).filter((b) => isBillKanbanEligible(b))

    if (bills.length === 0) return

    const run = async () =>
    {
      syncingRef.current = true
      try
      {
        for (const bill of bills)
        {
          const tarefas = useTaskStore.getState().tarefas
          const exists = tarefas.some(
            (t) => t.status !== 'concluida'
              && taskMatchesBill(t.titulo, bill, t.snippet_100_char, t.notas_locais),
          )
          if (exists) continue

          await createFinanceBillTask({
            billId: bill.id,
            titulo: billTaskTitle(bill),
            notas: billTaskNotes(bill),
            vencimento: bill.vencimento,
            diasRestantes: bill.diasRestantes,
          })
        }
      }
      finally
      {
        syncingRef.current = false
      }
    }

    void run()
  }, [enabled, contasFixas, reservedBills, cards, transactions, createFinanceBillTask])
}
