/**
 * Sincroniza cartões que existiam só no cache local para o Supabase.
 */
import type { VirtualCard } from '../store/storeTypes'
import { persistCardToServer } from './financeCardPersist'

export async function syncLocalCardsToServer(uid: string, cards: VirtualCard[]): Promise<VirtualCard[]>
{
  const saved: VirtualCard[] = []

  for (const card of cards)
  {
    const result = await persistCardToServer(uid, card)
    if (result.ok && result.data)
    {
      saved.push(result.data)
    }
    else
    {
      // Mantém o cartão no estado local para nova tentativa futura
      console.error('syncLocalCardsToServer:', card.id, result.error)
      saved.push(card)
    }
  }

  return saved
}
