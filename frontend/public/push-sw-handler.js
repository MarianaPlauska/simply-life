// Handler push - notificações com ações inline (Feito / Adiar)

const DEFAULT_ACTIONS = [
  { action: 'done', title: 'Feito' },
  { action: 'snooze', title: 'Adiar' },
];

function buildNotificationOptions(payload)
{
  const data = {
    url: payload.url || '/',
    kind: payload.kind || null,
    snoozeKey: payload.snoozeKey || payload.tag || 'simply-life',
    actionToken: payload.actionToken || null,
    clientOnly: Boolean(payload.clientOnly),
    medicamentoId: payload.medicamentoId ?? null,
    horario: payload.horario ?? null,
    taskId: payload.taskId ?? null,
    billKey: payload.billKey ?? null,
    nudgeKey: payload.nudgeKey ?? null,
  };

  const options = {
    body: payload.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag || 'simply-life',
    data,
  };

  if (payload.interactive || payload.actionToken || payload.clientOnly)
  {
    options.actions = DEFAULT_ACTIONS;
    options.requireInteraction = true;
  }

  return options;
}

async function callPushActionApi(action, data)
{
  if (!data?.actionToken)
  {
    return { ok: false, error: 'sem token' };
  }

  const res = await fetch('/api/push-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token: data.actionToken }),
  });

  try
  {
    return await res.json();
  }
  catch
  {
    return { ok: false, error: 'resposta inválida' };
  }
}

async function notifyClients(message)
{
  const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of list)
  {
    client.postMessage(message);
  }
  return list.length;
}

async function handleActionClick(action, data)
{
  if (data?.clientOnly)
  {
    const count = await notifyClients({ type: 'push-action', action, data });
    if (count > 0)
    {
      return { ok: true, message: action === 'done' ? 'Registrado no app' : 'Adiado no app' };
    }
    return { ok: false, error: 'app fechado' };
  }

  return callPushActionApi(action, data);
}

async function showFeedback(title, body)
{
  return self.registration.showNotification(title, {
    body,
    icon: '/pwa-192x192.png',
    tag: 'simply-life-feedback',
    silent: true,
  });
}

self.addEventListener('push', (event) =>
{
  let payload = {
    title: 'Simply-Life',
    body: 'Você tem um lembrete',
    url: '/',
    tag: 'simply-life',
  };

  try
  {
    if (event.data)
    {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  }
  catch { /* payload texto */ }

  event.waitUntil(
    self.registration.showNotification(payload.title, buildNotificationOptions(payload)),
  );
});

self.addEventListener('notificationclick', (event) =>
{
  event.notification.close();
  const data = event.notification.data || {};
  const action = event.action;
  const url = data.url || '/';

  if (action === 'done' || action === 'snooze')
  {
    event.waitUntil(
      (async () =>
      {
        const result = await handleActionClick(action, data);
        if (result?.ok)
        {
          await showFeedback('Simply-Life', result.message || 'Pronto');
          await notifyClients({ type: 'push-action', action, data, result });
          return;
        }

        if (action === 'snooze' && data.clientOnly)
        {
          await showFeedback('Simply-Life', 'Abra o app para adiar este lembrete');
        }
        else
        {
          await showFeedback('Simply-Life', 'Não foi possível agir aqui - abra o app');
        }

        if (self.clients.openWindow)
        {
          await self.clients.openWindow(url);
        }
      })(),
    );
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) =>
    {
      for (const client of list)
      {
        if ('focus' in client)
        {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow)
      {
        return self.clients.openWindow(url);
      }
      return undefined;
    }),
  );
});
