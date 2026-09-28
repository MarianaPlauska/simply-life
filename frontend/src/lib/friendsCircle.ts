import { supabase } from './supabase'

// Convites e círculo de amigos

export interface FriendPublicCard
{
  user_id: string
  display_name: string
  axel_calls_you: string
  accent: string
  mascot_mood: string
  avatar_style?: string
  level: number
  streak_count: number
  episode_headline: string
}

function randomCode(): string
{
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++)
  {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export async function createFriendInvite(): Promise<{ code: string; url: string } | null>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null

  const code = randomCode()
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const { error } = await supabase.from('friend_invites').insert({
    code,
    inviter_id: uid,
    expires_at: expires.toISOString(),
    uses_left: 8,
  })

  if (error)
  {
    console.error('createFriendInvite:', error)
    return null
  }

  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return { code, url: `${base}/join/${code}` }
}

/** Aceite atômico no banco (RPC accept_friend_invite, migração 064). */
export async function acceptFriendInvite(code: string): Promise<{ ok: boolean; message: string }>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return { ok: false, message: 'Faça login para aceitar o convite' }

  const { data, error } = await supabase.rpc('accept_friend_invite', {
    p_code: code.trim().toUpperCase(),
  })

  if (error)
  {
    console.error('acceptFriendInvite:', error)
    return { ok: false, message: 'Não foi possível aceitar agora. Tente de novo em instantes' }
  }

  const payload = (data ?? null) as { ok?: boolean; message?: string } | null
  return {
    ok: Boolean(payload?.ok),
    message: payload?.message ?? 'Não foi possível aceitar agora. Tente de novo em instantes',
  }
}

export async function fetchFriendCircle(): Promise<FriendPublicCard[]>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []

  const { data: links, error } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .eq('status', 'accepted')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)

  if (error || !links?.length) return []

  const friendIds = links.map((l) => (l.user_a === uid ? l.user_b : l.user_a))

  const { data: cards } = await supabase
    .from('user_public_cards')
    .select('*')
    .in('user_id', friendIds)

  return (cards ?? []) as FriendPublicCard[]
}
