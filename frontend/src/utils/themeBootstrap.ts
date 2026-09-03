import type { ColorScheme } from '../store/storeTypes'
import { getPersistStorageKey } from '../lib/userScopedStorage'
import {
  applyColorScheme,
  parseColorScheme,
  readDedicatedColorScheme,
} from './applyColorScheme'

const LEGACY_STORE_KEY = 'simply-life-store'

interface PersistBlob
{
  state?: {
    accessibility?: { colorScheme?: string }
    userId?: string
  }
}

function schemeFromBlob(raw: string | null): ColorScheme | null
{
  if (!raw) return null
  try
  {
    const parsed = JSON.parse(raw) as PersistBlob
    return parseColorScheme(parsed.state?.accessibility?.colorScheme)
  }
  catch { /* ignore */ }
  return null
}

/** Lê user id da sessão Supabase no localStorage (antes do React subir). */
function readSupabaseUserId(): string | null
{
  try
  {
    for (let i = 0; i < localStorage.length; i++)
    {
      const key = localStorage.key(i)
      if (!key || !key.startsWith('sb-') || !key.endsWith('-auth-token')) continue
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as {
        user?: { id?: string }
        currentSession?: { user?: { id?: string } }
      }
      const uid = parsed.user?.id ?? parsed.currentSession?.user?.id
      if (uid) return uid
    }
  }
  catch { /* ignore */ }
  return null
}

function collectStoreKeys(): string[]
{
  const keys: string[] = []
  const uid = readSupabaseUserId()
  if (uid) keys.push(getPersistStorageKey(uid))
  keys.push(getPersistStorageKey(null))
  keys.push(LEGACY_STORE_KEY)

  try
  {
    for (let i = 0; i < localStorage.length; i++)
    {
      const key = localStorage.key(i)
      if (key?.startsWith(`${LEGACY_STORE_KEY}:`))
      {
        keys.push(key)
      }
    }
  }
  catch { /* ignore */ }

  return [...new Set(keys)]
}

/** Lê o tema salvo no disco - chave dedicada primeiro, depois persist Zustand. */
export function readPersistedColorScheme(): ColorScheme
{
  const dedicated = readDedicatedColorScheme()
  if (dedicated) return dedicated

  for (const key of collectStoreKeys())
  {
    const scheme = schemeFromBlob(localStorage.getItem(key))
    if (scheme) return scheme
  }
  return 'dark'
}

/** Garante que o store em memória siga a escolha gravada neste aparelho. */
export function overlayRememberedColorScheme(accessibility: { colorScheme?: string } | undefined): ColorScheme
{
  const remembered = readPersistedColorScheme()
  if (accessibility)
  {
    accessibility.colorScheme = remembered
  }
  return remembered
}

/** Aplica tema salvo sem esperar o React - evita flash claro/escuro. */
export function bootstrapColorSchemeFromStorage(): ColorScheme
{
  const scheme = readPersistedColorScheme()
  applyColorScheme(scheme)
  return scheme
}

export function syncColorSchemeAfterRehydrate(): void
{
  bootstrapColorSchemeFromStorage()
}
