import { useEffect, useRef } from 'react'
import { registerPushSubscription } from '../lib/pushSubscription'
import { useTaskStore } from '../store/useTaskStore'

const REGISTERED_KEY = 'simply-life-push-registered'

/** Registra subscription Web Push no servidor — alertas de boleto via cron */
export function usePushSubscription(enabled = true): void
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const attempted = useRef(false)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn || attempted.current) return
    if (typeof window === 'undefined') return

    attempted.current = true

    void (async () =>
    {
      try
      {
        const ok = await registerPushSubscription()
        if (ok)
        {
          localStorage.setItem(REGISTERED_KEY, new Date().toISOString())
        }
      }
      catch
      {
        /* permissão negada ou VAPID ausente */
      }
    })()
  }, [enabled, isLoggedIn])
}
