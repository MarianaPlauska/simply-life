/**
 * Base da API Vercel - push-subscribe / push-test / push-action.
 * Metro (8082) não serve a API: use EXPO_PUBLIC_API_URL ou vercel dev :3000.
 */
import { Platform } from 'react-native'
import Constants from 'expo-constants'

export function getApiBaseUrl(): string
{
  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')
  if (fromEnv) return fromEnv

  if (__DEV__)
  {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname)
    {
      return `${window.location.protocol}//${window.location.hostname}:3000`
    }
    const hostUri = Constants.expoConfig?.hostUri
    if (hostUri)
    {
      const host = hostUri.split(':')[0]
      return `http://${host}:3000`
    }
  }

  return 'https://simply-life.app'
}

export async function apiFetch(
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<Response>
{
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (opts.token)
  {
    headers.Authorization = `Bearer ${opts.token}`
  }
  return fetch(`${getApiBaseUrl()}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
}
