/**
 * Base da API Vercel (Axel/IA, push-subscribe, push-test, push-action).
 *
 * O app (Expo Go, APK, Play Store, web) é só cliente: a IA roda nas funções
 * da Vercel, onde ficam as chaves (GROQ/GEMINI). Ordem de resolução:
 * 1. EXPO_PUBLIC_API_URL, exceto "localhost" num celular (lá localhost é o próprio aparelho)
 * 2. Em dev: `vercel dev` na máquina (:3000), pelo IP da rede do Metro
 * 3. Produção: https://simply-life.vercel.app
 * Se a base local não responder (vercel dev desligado), apiFetch cai para produção
 * e lembra disso até o app reiniciar.
 */
import { Platform } from 'react-native'
import Constants from 'expo-constants'

export const PRODUCTION_API_URL = 'https://simply-life.vercel.app'

let preferProduction = false

function isLocalHost(url: string): boolean
{
  return /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url)
}

function devLanBase(): string | null
{
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname)
  {
    return `${window.location.protocol}//${window.location.hostname}:3000`
  }
  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri)
  {
    return `http://${hostUri.split(':')[0]}:3000`
  }
  return null
}

export function getApiBaseUrl(): string
{
  if (preferProduction) return PRODUCTION_API_URL

  const fromEnv = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '')
  const envIsDeviceLocalhost = /localhost|127\.0\.0\.1/i.test(fromEnv) && Platform.OS !== 'web'
  if (fromEnv && !envIsDeviceLocalhost) return fromEnv

  if (__DEV__)
  {
    const lan = devLanBase()
    if (lan) return lan
  }

  return PRODUCTION_API_URL
}

async function rawFetch(
  base: string,
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown },
): Promise<Response>
{
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (opts.token)
  {
    headers.Authorization = `Bearer ${opts.token}`
  }
  return fetch(`${base}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
}

export async function apiFetch(
  path: string,
  opts: { method?: string; token?: string | null; body?: unknown } = {},
): Promise<Response>
{
  const base = getApiBaseUrl()
  if (base === PRODUCTION_API_URL || !isLocalHost(base))
  {
    return rawFetch(base, path, opts)
  }

  // Base local (vercel dev): se estiver desligada ou sem a rota, usa produção
  try
  {
    const res = await rawFetch(base, path, opts)
    if (res.status !== 404) return res
  }
  catch
  {
    /* conexão recusada / rede local indisponível */
  }
  preferProduction = true
  return rawFetch(PRODUCTION_API_URL, path, opts)
}
