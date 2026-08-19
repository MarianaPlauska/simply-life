// Registro de Web Push no servidor (VAPID + push_subscriptions)

import { supabase } from './supabase'

const API_BASE = '/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array
{
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++)
  {
    out[i] = raw.charCodeAt(i)
  }
  return out
}

export async function fetchVapidPublicKey(): Promise<string | null>
{
  try
  {
    const res = await fetch(`${API_BASE}/push-subscribe`)
    if (!res.ok) return null
    const data = await res.json() as { publicKey?: string; configured?: boolean }
    if (!data.configured || !data.publicKey) return null
    return data.publicKey
  }
  catch
  {
    return null
  }
}

export async function registerPushSubscription(): Promise<boolean>
{
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window))
  {
    return false
  }

  if (!('Notification' in window))
  {
    return false
  }

  if (Notification.permission !== 'granted')
  {
    return false
  }

  const publicKey = await fetchVapidPublicKey()
  if (!publicKey)
  {
    return false
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token)
  {
    return false
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription)
  {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    })
  }

  const res = await fetch(`${API_BASE}/push-subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  })

  return res.ok
}

export async function unregisterPushSubscription(): Promise<void>
{
  if (!('serviceWorker' in navigator)) return

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token)
  {
    await fetch(`${API_BASE}/push-subscribe`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  }

  await subscription.unsubscribe()
}

/** Pede permissão, registra a subscription e dispara um push de teste. */
export async function sendPushTest(): Promise<{ sent: number }>
{
  if (typeof window === 'undefined' || !('Notification' in window))
  {
    throw new Error('Este navegador não suporta notificações')
  }

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission()

  if (permission !== 'granted')
  {
    throw new Error('Permissão de notificação recusada')
  }

  const ok = await registerPushSubscription()
  if (!ok)
  {
    throw new Error('Não foi possível registrar o dispositivo (VAPID ausente?)')
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token)
  {
    throw new Error('Não autenticado')
  }

  const res = await fetch(`${API_BASE}/push-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  const data = await res.json().catch(() => ({})) as { sent?: number; error?: string }
  if (!res.ok)
  {
    throw new Error(data.error || 'Falha ao enviar push de teste')
  }

  return { sent: data.sent ?? 0 }
}
