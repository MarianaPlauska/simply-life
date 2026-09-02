/**
 * Envio via Expo Push API (tokens ExponentPushToken[...]).
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

export function isExpoPushToken(token)
{
  return typeof token === 'string'
    && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['))
}

export function isExpoSubscriptionRow(row)
{
  return row?.provider === 'expo' || isExpoPushToken(row?.endpoint)
}

/**
 * @param {string} token
 * @param {object} payload — mesmo shape do Web Push (title, body, url, tag, ...)
 */
export async function sendExpoPush(token, payload)
{
  if (!isExpoPushToken(token))
  {
    throw new Error('Token Expo inválido')
  }

  const body = typeof payload === 'string' ? JSON.parse(payload) : payload
  const message = {
    to: token,
    sound: 'default',
    title: body.title || 'Simply-Life',
    body: body.body || '',
    data: body,
    channelId: 'default',
    categoryId: body.interactive ? 'axel-actions' : undefined,
  }

  const res = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok)
  {
    const err = new Error(json?.errors?.[0]?.message || `Expo Push HTTP ${res.status}`)
    err.statusCode = res.status
    err.expo = json
    throw err
  }

  const ticket = Array.isArray(json.data) ? json.data[0] : json.data
  if (ticket?.status === 'error')
  {
    const err = new Error(ticket.message || 'Expo Push error')
    err.statusCode = ticket.details?.error === 'DeviceNotRegistered' ? 410 : 400
    err.expo = ticket
    throw err
  }

  return ticket
}

export function isExpiredExpoError(err)
{
  return err?.statusCode === 410
    || err?.expo?.details?.error === 'DeviceNotRegistered'
}
