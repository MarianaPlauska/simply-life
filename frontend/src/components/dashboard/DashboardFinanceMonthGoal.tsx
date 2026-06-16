import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { filterTransactionsForMonth } from '../../utils/rule503020'
import { FinanceMonthGoalWidget } from '../Finance/overview/FinanceMonthGoalWidget'

// Meta do mês no dashboard — versão compacta

export function DashboardFinanceMonthGoal()
{
  const transactions = useTaskStore((s) => s.transactions)

  const monthTx = useMemo(
    () => filterTransactionsForMonth(transactions),
    [transactions],
  )

  return (
    <FinanceMonthGoalWidget
      monthTransactions={monthTx}
      compact
    />
  )
}
