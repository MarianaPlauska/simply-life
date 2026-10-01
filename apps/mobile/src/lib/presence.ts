import { supabase, supabaseConfigured } from './supabase'

/** Marca a sessão como conectada para a lista admin. */
export async function pingPresence(): Promise<void>
{
  if (!supabaseConfigured) return
  const { data } = await supabase.auth.getUser()
  const uid = data.user?.id
  if (!uid) return
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('user_public_cards')
    .select('user_id')
    .eq('user_id', uid)
    .maybeSingle()
  if (existing)
  {
    await supabase
      .from('user_public_cards')
      .update({ last_seen_at: now })
      .eq('user_id', uid)
    return
  }
  const nome =
    (data.user?.user_metadata?.full_name as string | undefined)?.trim()
    || (data.user?.email ?? '').split('@')[0]
    || ''
  await supabase.from('user_public_cards').insert({
    user_id: uid,
    display_name: nome,
    axel_calls_you: nome,
    last_seen_at: now,
  })
}

/**
 * Foco junto: grava até quando estou focando (ou null ao parar) no cartão
 * público. Só roda com a preferência ligada. Sem a migração 072, falha calada.
 */
export async function setFocusingUntil(untilIso: string | null): Promise<void>
{
  if (!supabaseConfigured) return
  try
  {
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id
    if (!uid) return
    await supabase.from('user_public_cards').update({ focando_ate: untilIso }).eq('user_id', uid)
  }
  catch
  {
    /* offline ou 072 pendente */
  }
}
