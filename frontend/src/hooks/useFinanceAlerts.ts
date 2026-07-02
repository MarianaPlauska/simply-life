import { useMemo } from 'react'
import { buildFinanceAlerts, type FinanceAlert } from '../lib/financeAlerts'
import { useTaskStore } from '../store/useTaskStore'

/** Alertas financeiros unificados — orçamento, faturas, fixas, cartões, metas */
export function useFinanceAlerts(monthTransactions?: import('../store/storeTypes').Transaction[]): FinanceAlert[]
{
  const transactions = useTaskStore((s) => s.transactions)
  const categories = useTaskStore((s) => s.categories)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const reservedBillItems = useTaskStore((s) => s.reservedBillItems)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const financialGoals = useTaskStore((s) => s.financialGoals)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const tarefas = useTaskStore((s) => s.tarefas)

  return useMemo(
    () => buildFinanceAlerts({
      transactions,
      categories,
      budgetLimits,
      reservedBills,
      reservedBillItems,
      contasFixas,
      cards,
      financialGoals,
      recurringIncomes,
      monthTransactions,
      tarefas,
    }),
    [
      transactions,
      categories,
      budgetLimits,
      reservedBills,
      reservedBillItems,
      contasFixas,
      cards,
      financialGoals,
      recurringIncomes,
      monthTransactions,
      tarefas,
    ],
  )
}
