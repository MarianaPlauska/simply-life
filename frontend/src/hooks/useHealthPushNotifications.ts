import { useEffect } from 'react'
import { isWellbeingDashboardHidden } from '../lib/axelCareRotation'
import { showHealthNotification } from '../lib/healthNotifications'
import { useTaskStore } from '../store/useTaskStore'

const CHECK_MS = 2 * 60 * 1000
const COOLDOWN_MS = 10 * 60 * 1000

function storageKey(kind: string, id: string): string
{
  return `sl-health-push:${kind}:${id}`
}

function wasRecentlySent(key: string): boolean
{
  try
  {
    const raw = sessionStorage.getItem(key)
    if (!raw) return false
    return Date.now() - Number(raw) < COOLDOWN_MS
  }
  catch
  {
    return false
  }
}

function markSent(key: string): void
{
  try
  {
    sessionStorage.setItem(key, String(Date.now()))
  }
  catch { /* quota */ }
}

/** Lembretes de saúde no celular — SW quando permissão concedida */
export function useHealthPushNotifications(enabled = true): void
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn) return
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return

    const check = () =>
    {
      const hiddenUntil = workspacePrefs.wellbeing_dashboard_hidden_until
      const snoozed = isWellbeingDashboardHidden(hiddenUntil)
      if (humorHojeLista.length === 0 && !snoozed)
      {
        const hour = new Date().getHours()
        if (hour >= 9 && hour <= 20)
        {
          const today = new Date().toISOString().slice(0, 10)
          const key = storageKey('mood', today)
          if (!wasRecentlySent(key))
          {
            void showHealthNotification({
              title: 'AXEL · Bem-estar',
              body: 'Como você está hoje? Registre seu humor em um toque.',
              url: '/#dashboard-wellbeing',
              tag: key,
            }).then((ok) =>
            {
              if (ok) markSent(key)
            })
          }
        }
      }
    }

    check()
    const id = window.setInterval(check, CHECK_MS)
    return () => window.clearInterval(id)
  }, [
    enabled,
    isLoggedIn,
    humorHojeLista.length,
    workspacePrefs.wellbeing_dashboard_hidden_until,
  ])
}
