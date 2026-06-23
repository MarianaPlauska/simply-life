/**
 * Sincroniza cartões que existiam só no cache local para o Supabase.
 */
import type { VirtualCard } from '../store/storeTypes'
import { supabase } from './supabase'

function isModalidadeColumnMissing(err: { message?: string; code?: string }): boolean
{
  const msg = (err.message ?? '').toLowerCase()
  return msg.includes('modalidade') || err.code === 'PGRST204'
}

function buildCardRow(uid: string, card: VirtualCard, withModalidade: boolean): Record<string, unknown>
{
  const row: Record<string, unknown> = {
    id: card.id,
    user_id: uid,
    nome: card.nome,
    titular: card.titular,
    numero: card.numero,
    validade: card.validade,
    cvv: card.cvv,
    limite: card.limite,
    dia_vencimento: card.dia_vencimento ?? null,
    dia_fechamento: card.dia_fechamento ?? null,
    tipo_gradiente: card.tipo_gradiente,
    bandeira: card.bandeira,
    status: card.status,
  }
  if (withModalidade)
  {
    row.modalidade = card.modalidade ?? 'credito'
  }
  return row
}

export async function syncLocalCardsToServer(uid: string, cards: VirtualCard[]): Promise<VirtualCard[]>
{
  const saved: VirtualCard[] = []

  for (const card of cards)
  {
    try
    {
      let result = await supabase
        .from('fin_cartoes')
        .upsert(buildCardRow(uid, card, true), { onConflict: 'id' })
        .select()
        .single()

      if (result.error && isModalidadeColumnMissing(result.error))
      {
        result = await supabase
          .from('fin_cartoes')
          .upsert(buildCardRow(uid, card, false), { onConflict: 'id' })
          .select()
          .single()
      }

      if (result.error)
      {
        console.error('syncLocalCardsToServer:', card.id, result.error)
        saved.push(card)
        continue
      }

      if (result.data)
      {
        saved.push(result.data as VirtualCard)
      }
    }
    catch (e)
    {
      console.error('syncLocalCardsToServer:', card.id, e)
      saved.push(card)
    }
  }

  return saved
}
