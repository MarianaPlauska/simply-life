/**
 * Escuta troca de conta Supabase e isola cache/estado por usuário.
 */
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useTaskStore } from '../store/useTaskStore'
import { switchUserSession } from '../store/resetUserSession'
import { isLocalGuestUser } from '../lib/authSession'

async function reloadRemoteUserData(): Promise<void>
{
  const s = useTaskStore.getState()
  await Promise.allSettled([
    s.fetchTransactions?.(),
    s.fetchCards?.(),
    s.fetchContasFixas?.(),
    s.fetchCategories?.(),
    s.fetchBudgets?.(),
    s.fetchGoals?.(),
    s.fetchCashAccount?.(),
    s.fetchReservedBills?.(),
    s.fetchRecurringIncomes?.(),
    s.fetchHumorResumo?.(),
    s.fetchDiarioHoje?.(),
    s.fetchEntradasRecentes?.(),
    s.fetchHabitos?.(),
    s.fetchMedicamentos?.(),
    s.fetchTarefas?.(),
    s.fetchAnotacoes?.(),
    s.fetchWorkspacePrefs?.(),
  ])
}

export function useUserSessionIsolation(): void
{
  const bootstrapped = useRef(false)

  useEffect(() =>
  {
    let cancelled = false

    const bootstrap = async () =>
    {
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? null
      if (cancelled) return

      const switched = await switchUserSession(uid)
      bootstrapped.current = true

      if (switched && uid && !isLocalGuestUser(uid))
      {
        await useTaskStore.getState().checkSession()
        await reloadRemoteUserData()
      }
    }

    void bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) =>
    {
      if (!bootstrapped.current && event === 'INITIAL_SESSION') return

      const uid = session?.user?.id ?? null

      void (async () =>
      {
        const switched = await switchUserSession(uid)
        if (!switched) return

        if (uid && !isLocalGuestUser(uid))
        {
          await useTaskStore.getState().checkSession()
          await reloadRemoteUserData()
        }
      })()
    })

    return () =>
    {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])
}
