/**
 * Isolamento de cache local por usuário — evita vazamento entre contas no mesmo navegador.
 */

const LEGACY_STORE_KEY = 'simply-life-store'

let activeStorageUserId: string | null = null

export function setActiveStorageUserId(userId: string | null): void
{
  activeStorageUserId = userId
}

export function getActiveStorageUserId(): string | null
{
  return activeStorageUserId
}

export function scopedStorageKey(baseKey: string, userId?: string | null): string
{
  const uid = userId !== undefined ? userId : activeStorageUserId
  return uid ? `${baseKey}:${uid}` : `${baseKey}:anonymous`
}

export function getPersistStorageKey(userId?: string | null): string
{
  return scopedStorageKey(LEGACY_STORE_KEY, userId)
}

export function readScopedJson<T>(baseKey: string, userId?: string | null): T | null
{
  try
  {
    const raw = localStorage.getItem(scopedStorageKey(baseKey, userId))
    if (!raw) return null
    return JSON.parse(raw) as T
  }
  catch
  {
    return null
  }
}

export function writeScopedJson(baseKey: string, value: unknown, userId?: string | null): void
{
  localStorage.setItem(scopedStorageKey(baseKey, userId), JSON.stringify(value))
}

export function removeScopedKey(baseKey: string, userId?: string | null): void
{
  localStorage.removeItem(scopedStorageKey(baseKey, userId))
}

/** Move chave global antiga para o escopo do usuário */
export function migrateLegacyScopedKey(baseKey: string, userId: string): void
{
  const legacy = localStorage.getItem(baseKey)
  if (!legacy) return

  const scoped = scopedStorageKey(baseKey, userId)
  if (!localStorage.getItem(scoped))
  {
    localStorage.setItem(scoped, legacy)
  }
  localStorage.removeItem(baseKey)
}

const SCOPED_LOCAL_BASE_KEYS = [
  'simply-life-cash-initial',
  'simply-life-finance-recurring-income',
  'simply-life-finance-presets',
  'simply-life-finance-income-profile',
  'simply-life-finance-month-goal',
  'simply-life-finance-quick-card',
  'simply-life-finance-bill-dismiss',
  'simply-life-finance-reserved-bills',
  'simply-life-workspace-prefs',
  'simply-life:health-day-iso',
  'simply-life:water-prefs',
] as const

export function migrateAllLegacyLocalKeys(userId: string): void
{
  for (const key of SCOPED_LOCAL_BASE_KEYS)
  {
    migrateLegacyScopedKey(key, userId)
  }
}
