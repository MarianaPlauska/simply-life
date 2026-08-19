import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/useTaskStore'

/** Promise única por sessão — remounts reutilizam o mesmo carregamento */
let sessionInitPromise: Promise<void> | null = null
let sessionInitDone = false

const INIT_TIMEOUT_MS = 12_000

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
    fetchBillSettlements,
    runFinanceCheck,
    evaluateRule503020Compliance,
  } = useTaskStore.getState()

  hydrateExpensePresets()

  const tasks: Array<Promise<unknown>> = [
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
    fetchBillSettlements(),
  ]

  const results = await Promise.allSettled(tasks)
  for (const r of results)
  {
    if (r.status === 'rejected')
    {
      console.error('finance planner init partial failure:', r.reason)
    }
  }

  runFinanceCheck()
  void evaluateRule503020Compliance()
}

function withInitTimeout(promise: Promise<void>): Promise<void>
{
  return new Promise((resolve, reject) =>
  {
    const timer = setTimeout(() =>
    {
      reject(new Error('finance-init-timeout'))
    }, INIT_TIMEOUT_MS)

    promise
      .then(() =>
      {
        clearTimeout(timer)
        resolve()
      })
      .catch((err) =>
      {
        clearTimeout(timer)
        reject(err)
      })
  })
}

function getSessionInitPromise(): Promise<void>
{
  if (!sessionInitPromise)
  {
    sessionInitPromise = withInitTimeout(runFinancePlannerSessionInit())
      .then(() =>
      {
        sessionInitDone = true
      })
      .catch((err) =>
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
  const [loading, setLoading] = useState(() => !sessionInitDone)
  const userSessionReady = useTaskStore((s) => s.userSessionReady)

  useEffect(() =>
  {
    let cancelled = false
    const safetyTimer = setTimeout(() =>
    {
      if (!cancelled)
      {
        setLoading(false)
      }
    }, INIT_TIMEOUT_MS + 2_000)

    const init = async () =>
    {
      if (!userSessionReady)
      {
        return
      }

      if (sessionInitDone)
      {
        setLoading(false)
        return
      }

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
        clearTimeout(safetyTimer)
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
      clearTimeout(safetyTimer)
    }
  }, [userSessionReady])

  return { loading }
}

/** Limpa cache de init ao trocar de conta */
export function resetFinancePlannerInit(): void
{
  sessionInitPromise = null
  sessionInitDone = false
}
