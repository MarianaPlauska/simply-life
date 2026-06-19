// Handler push — exibe notificação server-side e abre deep link ao tocar
self.addEventListener('push', (event) =>
{
  let payload = {
    title: 'Simply-Life',
    body: 'Você tem um lembrete',
    url: '/',
    tag: 'simply-life',
  }

  try
  {
    if (event.data)
    {
      const parsed = event.data.json()
      payload = { ...payload, ...parsed }
    }
  }
  catch { /* payload texto */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag,
      data: { url: payload.url },
    }),
  )
})

self.addEventListener('notificationclick', (event) =>
{
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) =>
    {
      for (const client of list)
      {
        if ('focus' in client)
        {
          client.navigate(url)
          return client.focus()
        }
      }
      if (self.clients.openWindow)
      {
        return self.clients.openWindow(url)
      }
      return undefined
    }),
  )
})
