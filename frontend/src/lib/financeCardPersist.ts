// Persistência resiliente de cartões — tolera colunas opcionais ausentes no schema
// (migrations 014 dia_fechamento/dia_vencimento e 032 modalidade podem não estar aplicadas)
import type { VirtualCard } from '../store/storeTypes'
import { supabase } from './supabase'

interface CardDbError
{
  message?: string
  code?: string
  details?: string
}

/** Colunas garantidas desde a migration 006 (schema base) */
function baseCardRow(uid: string, card: VirtualCard): Record<string, unknown>
{
  return {
    id: card.id,
    user_id: uid,
    nome: card.nome,
    titular: card.titular,
    numero: card.numero,
    validade: card.validade,
    cvv: card.cvv,
    limite: card.limite,
    tipo_gradiente: card.tipo_gradiente,
    bandeira: card.bandeira,
    status: card.status,
  }
}

/** Indica erro de coluna inexistente no cache do PostgREST */
function isMissingColumnError(err: CardDbError | null | undefined): boolean
{
  if (!err) return false
  if (err.code === 'PGRST204') return true
  const msg = `${err.message ?? ''} ${err.details ?? ''}`.toLowerCase()
  return msg.includes('column') && msg.includes('does not exist')
}

/** Monta a linha completa, incluindo colunas opcionais que podem não existir */
function fullCardRow(uid: string, card: VirtualCard): Record<string, unknown>
{
  return {
    ...baseCardRow(uid, card),
    dia_vencimento: card.dia_vencimento ?? null,
    dia_fechamento: card.dia_fechamento ?? null,
    modalidade: card.modalidade ?? 'credito',
  }
}

export interface CardPersistResult
{
  ok: boolean
  data: VirtualCard | null
  error: CardDbError | null
}

/**
 * Salva um cartão via upsert por id. Tenta a linha completa; se o banco recusar
 * por coluna ausente, refaz com as colunas base — assim sempre persiste por user_id.
 */
export async function persistCardToServer(uid: string, card: VirtualCard): Promise<CardPersistResult>
{
  let result = await supabase
    .from('fin_cartoes')
    .upsert(fullCardRow(uid, card), { onConflict: 'id' })
    .select()
    .single()

  if (result.error && isMissingColumnError(result.error))
  {
    result = await supabase
      .from('fin_cartoes')
      .upsert(baseCardRow(uid, card), { onConflict: 'id' })
      .select()
      .single()
  }

  if (result.error)
  {
    return { ok: false, data: null, error: result.error }
  }

  return { ok: true, data: (result.data as VirtualCard) ?? card, error: null }
}
