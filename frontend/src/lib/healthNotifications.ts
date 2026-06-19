// Notificações de saúde via Service Worker (PWA + permissão)

export interface HealthNotificationPayload
{
  title: string
  body: string
  url: string
  tag: string
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

  try
  {
    const reg = await navigator.serviceWorker?.ready
    if (reg?.showNotification)
    {
      await reg.showNotification(payload.title, {
        body: payload.body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: payload.tag,
        data: { url: payload.url },
      })
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
