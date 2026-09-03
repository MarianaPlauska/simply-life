// Notificações de saúde via Service Worker (PWA + permissão)

import {
  buildInteractiveNotificationData,
  PUSH_INLINE_ACTIONS,
  type PushNotificationData,
} from './pushNotificationActions'

export interface HealthNotificationPayload
{
  title: string
  body: string
  url: string
  tag: string
  kind?: PushNotificationData['kind']
  taskId?: number
  medicamentoId?: number
  horario?: string
  interactive?: boolean
}

export async function showHealthNotification(payload: HealthNotificationPayload): Promise<boolean>
{
  if (typeof window === 'undefined' || !('Notification' in window))
  {
    return false
  }
  if (Notification.permission !== 'granted')
  {
    return false
  }

  const data = payload.interactive !== false
    ? buildInteractiveNotificationData({
        url: payload.url,
        tag: payload.tag,
        kind: payload.kind ?? (payload.taskId ? 'task' : undefined),
        taskId: payload.taskId ?? null,
        medicamentoId: payload.medicamentoId ?? null,
        horario: payload.horario ?? null,
        snoozeKey: payload.tag,
      })
    : { url: payload.url, tag: payload.tag }

  try
  {
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification)
    {
      const options: NotificationOptions & {
        actions?: Array<{ action: string; title: string }>
      } = {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: payload.tag,
        data,
        requireInteraction: payload.interactive !== false,
      }
      if (payload.interactive !== false)
      {
        options.actions = [...PUSH_INLINE_ACTIONS]
      }
      await reg.showNotification(payload.title, options)
      return true
    }

    // eslint-disable-next-line no-new
    new Notification(payload.title, { body: payload.body, icon: '/pwa-192x192.png' })
    return true
  }
  catch
  {
    return false
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission>
{
  if (typeof window === 'undefined' || !('Notification' in window))
  {
    return 'denied'
  }
  if (Notification.permission !== 'default')
  {
    return Notification.permission
  }
  return Notification.requestPermission()
}
