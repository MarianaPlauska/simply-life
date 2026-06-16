import { supabase } from './supabase'

// Convites e círculo de amigos

export interface FriendPublicCard
{
  user_id: string
  display_name: string
  axel_calls_you: string
  accent: string
  mascot_mood: string
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

export async function acceptFriendInvite(code: string): Promise<{ ok: boolean; message: string }>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return { ok: false, message: 'Faça login para aceitar o convite' }

  const { data: invite, error } = await supabase
    .from('friend_invites')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error || !invite)
  {
    return { ok: false, message: 'Convite inválido ou expirado' }
  }

  if (new Date(invite.expires_at) < new Date())
  {
    return { ok: false, message: 'Este convite expirou' }
  }

  if (invite.uses_left <= 0)
  {
    return { ok: false, message: 'Convite esgotado' }
  }

  if (invite.inviter_id === uid)
  {
    return { ok: false, message: 'Você não pode aceitar o próprio convite' }
  }

  const userA = invite.inviter_id < uid ? invite.inviter_id : uid
  const userB = invite.inviter_id < uid ? uid : invite.inviter_id

  const { error: friendErr } = await supabase.from('friendships').upsert({
    user_a: userA,
    user_b: userB,
    status: 'accepted',
  }, { onConflict: 'user_a,user_b' })

  if (friendErr)
  {
    console.error('acceptFriendInvite:', friendErr)
    return { ok: false, message: 'Não foi possível criar amizade' }
  }

  await supabase
    .from('friend_invites')
    .update({ uses_left: Math.max(0, invite.uses_left - 1) })
    .eq('id', invite.id)

  return { ok: true, message: 'Vocês estão no mesmo Círculo!' }
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
