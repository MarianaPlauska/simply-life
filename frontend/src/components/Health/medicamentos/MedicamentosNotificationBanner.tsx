import { Bell, BellOff, Check } from 'lucide-react'
import { registerPushSubscription } from '../../../lib/pushSubscription'
import { requestNotificationPermission } from '../../../lib/healthNotifications'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

interface MedicamentosNotificationBannerProps
{
  compact?: boolean
}

export function MedicamentosNotificationBanner({ compact = false }: MedicamentosNotificationBannerProps)
{
  if (typeof window === 'undefined' || !('Notification' in window))
  {
    return null
  }

  const permission = Notification.permission
  const granted = permission === 'granted'
  const denied = permission === 'denied'

  const enable = async () =>
  {
    const perm = await requestNotificationPermission()
    if (perm === 'granted')
    {
      await registerPushSubscription()
      try
      {
        localStorage.setItem('simply-life-push-registered', new Date().toISOString())
      }
      catch { /* quota */ }
    }
  }

  if (granted && compact)
  {
    return (
      <p className={`flex items-center gap-1.5 text-[11px] ${AXEL_TEXT_SECONDARY}`}>
        <Check className="w-3.5 h-3.5 text-concluido shrink-0" />
        Lembretes ativos no horário da dose
      </p>
    )
  }

  if (denied)
  {
    return (
      <section className="rounded-sl border border-line bg-chrome/30 px-4 py-3 flex gap-3">
        <BellOff className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
        <div>
          <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Notificações bloqueadas</p>
          <p className={`text-[11px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            No celular: Configurações do navegador → Simply-Life → permitir notificações.
          </p>
        </div>
      </section>
    )
  }

  if (granted)
  {
    return (
      <section className="rounded-sl border border-health/25 bg-health-muted px-4 py-3 flex gap-3">
        <Bell className="w-4 h-4 text-health shrink-0 mt-0.5" />
        <div>
          <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Lembretes no horário</p>
          <p className={`text-[11px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            Você recebe alerta na hora da dose. Com o app instalado funciona mesmo fechado (push).
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-sl border border-health/30 bg-health-muted px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex gap-3 flex-1 min-w-0">
        <Bell className="w-4 h-4 text-health shrink-0 mt-0.5" />
        <div>
          <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>Ativar lembretes no horário</p>
          <p className={`text-[11px] mt-0.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            O app avisa na hora de cada dose. Instale o PWA no celular para receber com o app fechado.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void enable()}
        className="shrink-0 px-4 py-2.5 rounded-sl bg-health-muted border border-health/30 text-ink font-mono text-[10px] uppercase min-h-[44px] hover:bg-health-muted/80 transition-colors"
      >
        Permitir notificações
      </button>
    </section>
  )
}
