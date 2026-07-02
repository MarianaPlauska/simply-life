import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/useTaskStore'

/** Promise única por sessão — remounts (Strict Mode) reutilizam o mesmo carregamento */
let sessionInitPromise: Promise<void> | null = null

async function runFinancePlannerSessionInit(): Promise<void>
{
  const {
    hydrateExpensePresets,
    fetchTransactions,
    fetchCategories,
    fetchGoals,
    fetchCards,
    fetchContasFixas,
    fetchCashAccount,
    fetchReservedBills,
    fetchReservedBillItems,
    fetchBudgets,
    fetchRecurringIncomes,
    runFinanceCheck,
    evaluateRule503020Compliance,
  } = useTaskStore.getState()

  hydrateExpensePresets()

  await Promise.all([
    fetchTransactions(),
    fetchCategories(),
    fetchGoals(),
    fetchCards(),
    fetchContasFixas(),
    fetchCashAccount(),
    fetchReservedBills(),
    fetchReservedBillItems(),
    fetchBudgets(),
    fetchRecurringIncomes(),
  ])
  runFinanceCheck()
  await evaluateRule503020Compliance()
}

function getSessionInitPromise(): Promise<void>
{
  if (!sessionInitPromise)
  {
    sessionInitPromise = runFinancePlannerSessionInit().catch((err) =>
    {
      sessionInitPromise = null
      throw err
    })
  }
  return sessionInitPromise
}

/** Carrega dados do planner e avalia conformidade 50-30-20 */
export function useFinancePlannerInit(): { loading: boolean }
{
  const [loading, setLoading] = useState(true)
  const userSessionReady = useTaskStore((s) => s.userSessionReady)

  useEffect(() =>
  {
    if (!userSessionReady)
    {
      setLoading(true)
      return
    }

    let cancelled = false

    const init = async () =>
    {
      setLoading(true)
      try
      {
        await getSessionInitPromise()
      }
      catch (e)
      {
        console.error('useFinancePlannerInit:', e)
      }
      finally
      {
        if (!cancelled)
        {
          setLoading(false)
        }
      }
    }

    void init()

    return () =>
    {
      cancelled = true
    }
  }, [userSessionReady])

  return { loading }
}

/** Limpa cache de init ao trocar de conta */
export function resetFinancePlannerInit(): void
{
  sessionInitPromise = null
}
