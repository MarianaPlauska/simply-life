import { useEffect, useRef } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import {
  billTaskNotes,
  billTaskTitle,
  getUpcomingBills,
} from '../lib/financeBillOrchestrator'

/** Sincroniza boletos/contas a vencer como tarefas no Kanban — roda globalmente */
export function useFinanceBillKanbanSync(enabled = true)
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)
  const tarefas = useTaskStore((s) => s.tarefas)
  const createFinanceBillTask = useTaskStore((s) => s.createFinanceBillTask)
  const syncedRef = useRef<string>('')

  useEffect(() =>
  {
    if (!enabled) return

    const bills = getUpcomingBills({
      contasFixas,
      reservedBills,
      cards,
      transactions,
      windowDays: 7,
    })

    const key = bills.map((b) => b.id).join(',')
    if (key === syncedRef.current) return
    syncedRef.current = key

    const run = async () =>
    {
      for (const bill of bills)
      {
        if (bill.diasRestantes > 3) continue
        const exists = tarefas.some(
          (t) => t.status !== 'concluida' && t.titulo.includes(bill.id),
        )
        if (exists) continue

        await createFinanceBillTask({
          titulo: billTaskTitle(bill),
          notas: billTaskNotes(bill),
          vencimento: bill.vencimento,
          diasRestantes: bill.diasRestantes,
        })
      }
    }

    void run()
  }, [enabled, contasFixas, reservedBills, cards, transactions, tarefas, createFinanceBillTask])
}
