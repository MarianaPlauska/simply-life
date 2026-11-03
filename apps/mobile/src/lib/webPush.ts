import { Platform } from 'react-native'
import { apiFetch } from './apiBase'
import { supabase } from './supabase'

function supported(): boolean
{
  return Platform.OS === 'web'
    && typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && typeof window !== 'undefined'
    && 'PushManager' in window
    && 'Notification' in window
}

function urlBase64ToUint8Array(base64: string): Uint8Array
{
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Liga o service worker (abrir sem internet + receber notificação). */
export function registerServiceWorker(): void
{
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  if (typeof location !== 'undefined' && location.hostname === 'localhost') return
  void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
}

/**
 * Inscreve este navegador nas notificações.
 * `prompt` só deve ser true depois de um toque da pessoa (o Safari exige).
 */
export async function registerWebPushAsync(prompt: boolean): Promise<{ ok: boolean; error?: string; skipped?: boolean }>
{
  if (!supported()) return { ok: false, error: 'Este navegador não recebe notificações' }

  let permission = Notification.permission
  if (permission === 'default' && prompt) permission = await Notification.requestPermission()
  if (permission !== 'granted')
  {
    return prompt ? { ok: false, error: 'Permita as notificações para o site nas configurações do navegador' } : { ok: true, skipped: true }
  }

  const keyRes = await apiFetch('/api/push-subscribe', { method: 'GET' }).catch(() => null)
  const keyJson = keyRes?.ok ? await keyRes.json().catch(() => ({})) as { publicKey?: string; configured?: boolean } : {}
  if (!keyJson.configured || !keyJson.publicKey) return { ok: false, error: 'Notificações da web ainda não estão ligadas no servidor' }

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return { ok: false, error: 'Entre na conta para receber notificações' }

  const reg = await navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready)
  const sub = await reg.pushManager.getSubscription()
    ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(keyJson.publicKey) as BufferSource,
    })

  const res = await apiFetch('/api/push-subscribe', {
    method: 'POST',
    token,
    body: { subscription: sub.toJSON() },
  })
  if (!res.ok)
  {
    const err = await res.json().catch(() => ({})) as { error?: string }
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  }
  return { ok: true }
}

export async function unregisterWebPushAsync(): Promise<void>
{
  if (!supported()) return
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = await reg?.pushManager.getSubscription()
  if (!sub) return
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (token)
  {
    await apiFetch('/api/push-subscribe', {
      method: 'DELETE',
      token,
      body: { endpoint: sub.endpoint },
    }).catch(() => undefined)
  }
  await sub.unsubscribe().catch(() => undefined)
}
