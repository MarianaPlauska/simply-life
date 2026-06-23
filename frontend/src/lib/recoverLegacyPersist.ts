/**
 * Recupera dados do persist antigo (simply-life-store global) após migração por usuário.
 */
import type { VirtualCard } from '../store/storeTypes'
import { getPersistStorageKey } from './userScopedStorage'

const LEGACY_STORE_KEY = 'simply-life-store'

const MERGE_FIELDS = [
  'cards',
  'transactions',
  'contasFixas',
  'habitos',
  'budgetLimits',
] as const

type MergeField = (typeof MERGE_FIELDS)[number]

function readZustandPersistState(raw: string | null): Record<string, unknown> | null
{
  if (!raw) return null

  try
  {
    const parsed = JSON.parse(raw) as { state?: Record<string, unknown> }
    if (parsed?.state && typeof parsed.state === 'object')
    {
      return parsed.state
    }
    return parsed as Record<string, unknown>
  }
  catch
  {
    return null
  }
}

function mergeFieldIfEmpty(target: Record<string, unknown>, source: Record<string, unknown>, field: MergeField): void
{
  const current = target[field]
  const incoming = source[field]
  if (!Array.isArray(incoming) || incoming.length === 0) return
  if (!Array.isArray(current) || current.length === 0)
  {
    target[field] = incoming
  }
}

export function mergeLegacyPersistIntoScoped(userId: string): void
{
  const legacyRaw = localStorage.getItem(LEGACY_STORE_KEY)
  const scopedKey = getPersistStorageKey(userId)
  const scopedRaw = localStorage.getItem(scopedKey)
  const legacyState = readZustandPersistState(legacyRaw)

  if (!legacyState && !scopedRaw && legacyRaw)
  {
    localStorage.setItem(scopedKey, legacyRaw)
    return
  }

  if (!legacyState) return

  let envelope: { state: Record<string, unknown>; version?: number }
  try
  {
    envelope = scopedRaw
      ? JSON.parse(scopedRaw) as { state: Record<string, unknown>; version?: number }
      : { state: {}, version: 0 }
  }
  catch
  {
    envelope = { state: {}, version: 0 }
  }

  if (!envelope.state || typeof envelope.state !== 'object')
  {
    envelope.state = {}
  }

  for (const field of MERGE_FIELDS)
  {
    mergeFieldIfEmpty(envelope.state, legacyState, field)
  }

  localStorage.setItem(scopedKey, JSON.stringify(envelope))
}

export function recoverCardsFromPersist(userId: string): VirtualCard[]
{
  const keys = [getPersistStorageKey(userId), LEGACY_STORE_KEY]
  const byId = new Map<string, VirtualCard>()

  for (const key of keys)
  {
    const state = readZustandPersistState(localStorage.getItem(key))
    const cards = state?.cards
    if (!Array.isArray(cards)) continue

    for (const card of cards)
    {
      if (card && typeof card === 'object' && typeof (card as VirtualCard).id === 'string')
      {
        byId.set((card as VirtualCard).id, card as VirtualCard)
      }
    }
  }

  return [...byId.values()]
}
