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
