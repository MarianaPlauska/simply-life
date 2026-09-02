import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as SecureStore from 'expo-secure-store'
import Constants from 'expo-constants'
import { apiFetch } from './apiBase'
import { supabase } from './supabase'
import {
  configureNativePush,
  getNativeExpoPushToken,
  requestNativePushPermission,
  setNativeAndroidChannel,
} from './pushNotifications'

const TOKEN_KEY = 'simply-life-expo-push-token'

async function persistToken(token: string): Promise<void>
{
  if (Platform.OS === 'web')
  {
    if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token)
    return
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function getSavedExpoPushToken(): Promise<string | null>
{
  if (Platform.OS === 'web')
  {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  }
  return SecureStore.getItemAsync(TOKEN_KEY)
}

async function clearSavedToken(): Promise<void>
{
  if (Platform.OS === 'web')
  {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY)
    return
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export async function registerExpoPushAsync(): Promise<{
  ok: boolean
  token?: string
  error?: string
  skipped?: boolean
}>
{
  if (Platform.OS === 'web')
  {
    return { ok: true, skipped: true }
  }

  if (!Device.isDevice)
  {
    return { ok: false, error: 'Push nativo exige um dispositivo físico' }
  }

  await setNativeAndroidChannel()

  const granted = await requestNativePushPermission()
  if (!granted)
  {
    return { ok: false, error: 'Permissão de notificação negada' }
  }

  await configureNativePush()

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId
    || Constants.easConfig?.projectId
    || process.env.EXPO_PUBLIC_EAS_PROJECT_ID

  let token: string
  try
  {
    token = await getNativeExpoPushToken(
      typeof projectId === 'string' ? projectId : undefined,
    )
  }
  catch (e)
  {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Falha ao obter Expo Push Token',
    }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken)
  {
    return { ok: false, error: 'Sessão Supabase necessária para registrar push' }
  }

  const res = await apiFetch('/api/push-subscribe', {
    method: 'POST',
    token: accessToken,
    body: {
      provider: 'expo',
      token,
      platform: Platform.OS,
    },
  })

  if (!res.ok)
  {
    const err = await res.json().catch(() => ({})) as { error?: string }
    return { ok: false, error: err.error || `HTTP ${res.status}` }
  }

  await persistToken(token)
  return { ok: true, token }
}

export async function unregisterExpoPushAsync(): Promise<void>
{
  const token = await getSavedExpoPushToken()
  if (!token) return
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (accessToken)
  {
    await apiFetch('/api/push-subscribe', {
      method: 'DELETE',
      token: accessToken,
      body: { token, endpoint: token },
    }).catch(() => undefined)
  }
  await clearSavedToken()
}

export async function sendPushTestAsync(): Promise<{ ok: boolean; sent?: number; error?: string }>
{
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  if (!accessToken) return { ok: false, error: 'Não autenticado' }

  const res = await apiFetch('/api/push-test', {
    method: 'POST',
    token: accessToken,
    body: {},
  })
  const json = await res.json().catch(() => ({})) as { ok?: boolean; sent?: number; error?: string }
  if (!res.ok) return { ok: false, error: json.error || `HTTP ${res.status}` }
  return { ok: true, sent: json.sent }
}

/** Deep link / resposta de ação inline → push-action */
export async function handlePushActionAsync(
  action: 'done' | 'snooze',
  token: string,
): Promise<void>
{
  await apiFetch('/api/push-action', {
    method: 'POST',
    body: { action, token },
  })
}
