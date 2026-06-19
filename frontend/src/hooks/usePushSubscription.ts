import { useEffect, useRef } from 'react'
import { registerPushSubscription } from '../lib/pushSubscription'
import { useTaskStore } from '../store/useTaskStore'
import { isSetupComplete } from '../lib/userWorkspacePrefs'

const REGISTERED_KEY = 'simply-life-push-registered'

/** Sincroniza subscription Web Push quando permissão já concedida */
export function usePushSubscription(enabled = true): void
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const workspacePrefsLoaded = useTaskStore((s) => s.workspacePrefsLoaded)
  const attempted = useRef(false)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn || !workspacePrefsLoaded) return
    if (!isSetupComplete(workspacePrefs)) return
    if (attempted.current) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

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
        /* VAPID ausente */
      }
    })()
  }, [enabled, isLoggedIn, workspacePrefs, workspacePrefsLoaded])
}
