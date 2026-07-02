/**
 * Recupera dados do persist antigo (simply-life-store global) após migração por usuário.
 * Desativado para campos sensíveis — evita vazamento entre contas no mesmo navegador.
 */
import type { VirtualCard } from '../store/storeTypes'
import { getPersistStorageKey } from './userScopedStorage'

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

/** Não mescla mais finanças/saúde do persist global — só migra envelope vazio se necessário */
export function mergeLegacyPersistIntoScoped(_userId: string): void
{
  /* intencionalmente vazio */
}

export function recoverCardsFromPersist(userId: string): VirtualCard[]
{
  const state = readZustandPersistState(localStorage.getItem(getPersistStorageKey(userId)))
  const cards = state?.cards
  if (!Array.isArray(cards)) return []

  return cards.filter(
    (card): card is VirtualCard =>
      Boolean(card && typeof card === 'object' && typeof (card as VirtualCard).id === 'string'),
  )
}
