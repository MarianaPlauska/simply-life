import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { registerPushSubscription } from '../../lib/pushSubscription'
import { requestNotificationPermission } from '../../lib/healthNotifications'
import { useTaskStore } from '../../store/useTaskStore'
import { isSetupComplete } from '../../lib/userWorkspacePrefs'

const DISMISS_KEY = 'simply-life-notif-prompt-dismissed'

export function NotificationPermissionPrompt()
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const workspacePrefs = useTaskStore((s) => s.workspacePrefs)
  const workspacePrefsLoaded = useTaskStore((s) => s.workspacePrefsLoaded)
  const [hidden, setHidden] = useState(() =>
  {
    try
    {
      return localStorage.getItem(DISMISS_KEY) === '1'
    }
    catch
    {
      return false
    }
  })
  const [loading, setLoading] = useState(false)

  if (!isLoggedIn || !workspacePrefsLoaded || !isSetupComplete(workspacePrefs))
  {
    return null
  }
  if (hidden) return null
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'default') return null

  const dismiss = () =>
  {
    localStorage.setItem(DISMISS_KEY, '1')
    setHidden(true)
  }

  const enable = async () =>
  {
    setLoading(true)
    try
    {
      await requestNotificationPermission()
      const ok = await registerPushSubscription()
      if (ok)
      {
        localStorage.setItem('simply-life-push-registered', new Date().toISOString())
      }
      dismiss()
    }
    finally
    {
      setLoading(false)
    }
  }

  return (
    <div className="mx-3 sm:mx-4 lg:mx-8 max-w-[1600px] lg:mx-auto w-auto rounded-sl border border-accent/30 bg-accent-muted/40 px-3 py-2.5 flex items-start gap-3">
      <Bell className="w-4 h-4 text-accent shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-ink leading-snug">
          Ative lembretes de medicamentos, humor e boletos — mesmo com o app fechado.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void enable()}
            className="px-3 py-1.5 rounded-sl bg-ink text-fundo text-[11px] font-mono uppercase disabled:opacity-50"
          >
            Permitir notificações
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="px-3 py-1.5 rounded-sl border border-line text-[11px] font-mono uppercase text-ink-muted"
          >
            Agora não
          </button>
        </div>
      </div>
      <button type="button" onClick={dismiss} className="text-ink-muted hover:text-ink p-1" aria-label="Fechar">
        <X size={16} />
      </button>
    </div>
  )
}
