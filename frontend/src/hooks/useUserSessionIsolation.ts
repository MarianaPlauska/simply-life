/**
 * Escuta troca de conta Supabase e isola cache/estado por usuário.
 */
import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useTaskStore } from '../store/useTaskStore'
import { switchUserSession } from '../store/resetUserSession'
import { isLocalGuestUser } from '../lib/authSession'
import { reloadRemoteUserData } from '../lib/reloadRemoteUserData'

export function useUserSessionIsolation(): void
{
  const bootstrapped = useRef(false)

  useEffect(() =>
  {
    let cancelled = false

    const bootstrap = async () =>
    {
      useTaskStore.getState().setUserSessionReady(false)
      const { data: { session } } = await supabase.auth.getSession()
      const uid = session?.user?.id ?? null
      if (cancelled) return

      const switched = await switchUserSession(uid)
      bootstrapped.current = true

      if (uid && !isLocalGuestUser(uid))
      {
        await useTaskStore.getState().checkSession()
        if (switched || uid)
        {
          await reloadRemoteUserData()
        }
      }

      if (!cancelled)
      {
        useTaskStore.getState().setUserSessionReady(true)
      }
    }

    void bootstrap()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) =>
    {
      if (!bootstrapped.current && event === 'INITIAL_SESSION') return

      const uid = session?.user?.id ?? null

      void (async () =>
      {
        useTaskStore.getState().setUserSessionReady(false)
        const switched = await switchUserSession(uid)

        if (uid && !isLocalGuestUser(uid))
        {
          await useTaskStore.getState().checkSession()
          if (switched || uid)
          {
            await reloadRemoteUserData()
          }
        }

        useTaskStore.getState().setUserSessionReady(true)
      })()
    })

    return () =>
    {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])
}
