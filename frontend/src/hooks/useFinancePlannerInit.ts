import { useEffect } from 'react'
import { useTaskStore } from '../store/useTaskStore'

/** Carrega dados do planner e avalia conformidade 50-30-20 */
export function useFinancePlannerInit(): void
{
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions)
  const fetchCategories = useTaskStore((s) => s.fetchCategories)
  const fetchGoals = useTaskStore((s) => s.fetchGoals)
  const fetchCards = useTaskStore((s) => s.fetchCards)
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas)
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck)
  const evaluateRule503020 = useTaskStore((s) => s.evaluateRule503020Compliance)

  useEffect(() =>
  {
    const init = async () =>
    {
      await Promise.all([
        fetchTransactions(),
        fetchCategories(),
        fetchGoals(),
        fetchCards(),
        fetchContasFixas(),
      ])
      runFinanceCheck()
      await evaluateRule503020()
    }
    init()
  }, [
    fetchTransactions,
    fetchCategories,
    fetchGoals,
    fetchCards,
    fetchContasFixas,
    runFinanceCheck,
    evaluateRule503020,
  ])
}
