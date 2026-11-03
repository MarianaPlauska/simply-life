import { acceptFriendInvite, createFriendInvite, SHARED_GOAL_CHEERS } from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'
import { appOrigin } from '../appOrigin'

/** Amigo aceito no Círculo (dados do cartão público, nada além disso) */
export type FriendCard = {
  userId: string
  displayName: string
  accent: string
  avatarStyle: string
  muted: boolean
  /** foco junto: até quando o amigo está focando (só se ele compartilha) */
  focandoAte: string | null
  /** Elo (dias seguidos) do cartão público */
  streak: number
  cardUpdatedAt: string | null
}

export type CircleMoment = {
  id: string
  kind: 'joined' | 'cheer' | 'elo'
  at: string
  friendId: string | null
  title: string
  detail?: string
}

export type PendingFriendInvite = {
  id: number
  code: string
  expiresAt: string
  usesLeft: number
}

async function currentUid(): Promise<string | null>
{
  if (!supabaseConfigured) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export async function fetchFriends(): Promise<FriendCard[]>
{
  const uid = await currentUid()
  if (!uid) return []

  const { data: links, error } = await supabase
    .from('friendships')
    .select('user_a, user_b')
    .eq('status', 'accepted')
    .or(`user_a.eq.${uid},user_b.eq.${uid}`)

  if (error) throw new Error(error.message)
  const ids = (links ?? []).map((l) => (l.user_a === uid ? String(l.user_b) : String(l.user_a)))
  if (ids.length === 0) return []

  const cols = 'user_id, display_name, axel_calls_you, accent, avatar_style, streak_count, updated_at'
  const [cardsRes, { data: mutes }] = await Promise.all([
    supabase.from('user_public_cards').select(`${cols}, focando_ate`).in('user_id', ids),
    supabase.from('friend_mutes').select('friend_id').eq('user_id', uid),
  ])
  // 072 pendente: lê sem a coluna do foco junto
  const cards = cardsRes.error
    ? (await supabase.from('user_public_cards').select(cols).in('user_id', ids)).data
    : cardsRes.data

  const muted = new Set((mutes ?? []).map((m) => String(m.friend_id)))
  const byId = new Map((cards ?? []).map((c) => [String(c.user_id), c]))

  return ids
    .map((id) =>
    {
      const c = byId.get(id)
      const name = String(c?.axel_calls_you ?? '').trim() || String(c?.display_name ?? '').trim() || 'Amigo'
      return {
        userId: id,
        displayName: name,
        accent: String(c?.accent ?? 'copper'),
        avatarStyle: String(c?.avatar_style ?? 'initials'),
        muted: muted.has(id),
        focandoAte: (c as { focando_ate?: string | null } | undefined)?.focando_ate ?? null,
        streak: Number(c?.streak_count ?? 0),
        cardUpdatedAt: c?.updated_at ? String(c.updated_at) : null,
      }
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
}

/** Aceita o código do amigo (ou o link inteiro /join/CODIGO). */
export async function acceptFriendCode(input: string): Promise<{ ok: boolean; message: string }>
{
  const code = input.trim().split('/join/').pop()?.split(/[?#/]/)[0]?.trim() ?? ''
  if (!code) return { ok: false, message: 'Digite o código do convite' }
  return acceptFriendInvite(supabase as never, code)
}

/**
 * Linha do tempo do Círculo, só com o que já é visível hoje (RLS):
 * quando cada amizade começou, apoios trocados nas metas juntos e o Elo atual.
 * Nada de registro pessoal (humor, gasto, água) entra aqui.
 */
export async function fetchCircleTimeline(friends: FriendCard[]): Promise<CircleMoment[]>
{
  const uid = await currentUid()
  if (!uid) return []
  const nameOf = (id: string) => friends.find((f) => f.userId === id)?.displayName ?? 'Alguém do grupo'
  const moments: CircleMoment[] = []

  const [linksRes, cheersRes] = await Promise.all([
    supabase
      .from('friendships')
      .select('user_a, user_b, created_at')
      .eq('status', 'accepted')
      .or(`user_a.eq.${uid},user_b.eq.${uid}`),
    supabase
      .from('shared_goal_cheers')
      .select('id, goal_id, from_user, preset_key, created_at')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  for (const l of linksRes.data ?? [])
  {
    const friendId = l.user_a === uid ? String(l.user_b) : String(l.user_a)
    moments.push({
      id: `joined-${friendId}`,
      kind: 'joined',
      at: String(l.created_at),
      friendId,
      title: `Você e ${nameOf(friendId)} entraram no mesmo Círculo`,
    })
  }

  const cheers = cheersRes.data ?? []
  const goalIds = [...new Set(cheers.map((c) => String(c.goal_id)))]
  const { data: goals } = goalIds.length
    ? await supabase.from('shared_goals').select('id, titulo').in('id', goalIds)
    : { data: [] as { id: string; titulo: string }[] }
  const goalTitle = new Map((goals ?? []).map((g) => [String(g.id), String(g.titulo)]))

  for (const c of cheers)
  {
    const from = String(c.from_user)
    const label = SHARED_GOAL_CHEERS.find((p) => p.key === c.preset_key)?.label ?? 'Apoio'
    moments.push({
      id: `cheer-${c.id}`,
      kind: 'cheer',
      at: String(c.created_at),
      friendId: from === uid ? null : from,
      title: from === uid ? `Você mandou "${label}"` : `${nameOf(from)} mandou "${label}"`,
      detail: goalTitle.get(String(c.goal_id)),
    })
  }

  for (const f of friends)
  {
    if (f.streak < 2) continue
    moments.push({
      id: `elo-${f.userId}`,
      kind: 'elo',
      at: f.cardUpdatedAt ?? new Date().toISOString(),
      friendId: f.userId,
      title: `${f.displayName} está com Elo de ${f.streak} dias`,
    })
  }

  return moments.sort((a, b) => b.at.localeCompare(a.at))
}

/** Convites que eu mandei e ainda valem */
export async function fetchPendingFriendInvites(): Promise<PendingFriendInvite[]>
{
  const uid = await currentUid()
  if (!uid) return []
  const { data, error } = await supabase
    .from('friend_invites')
    .select('id, code, expires_at, uses_left')
    .eq('inviter_id', uid)
    .gt('expires_at', new Date().toISOString())
    .gt('uses_left', 0)
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    id: Number(r.id),
    code: String(r.code),
    expiresAt: String(r.expires_at),
    usesLeft: Number(r.uses_left),
  }))
}

export async function createFriendInviteLink(): Promise<{ code: string; url: string } | null>
{
  if (!supabaseConfigured) return null
  return createFriendInvite(supabase as never, appOrigin())
}

export async function revokeFriendInvite(id: number): Promise<boolean>
{
  const { error } = await supabase.from('friend_invites').delete().eq('id', id)
  return !error
}

export async function removeFriend(friendId: string): Promise<boolean>
{
  const uid = await currentUid()
  if (!uid) return false
  const a = uid < friendId ? uid : friendId
  const b = uid < friendId ? friendId : uid
  const { error } = await supabase.from('friendships').delete().eq('user_a', a).eq('user_b', b)
  if (error) return false
  await supabase.from('friend_mutes').delete().eq('user_id', uid).eq('friend_id', friendId)
  return true
}

export async function setFriendMuted(friendId: string, muted: boolean): Promise<boolean>
{
  const uid = await currentUid()
  if (!uid) return false
  if (muted)
  {
    const { error } = await supabase
      .from('friend_mutes')
      .upsert({ user_id: uid, friend_id: friendId }, { onConflict: 'user_id,friend_id' })
    return !error
  }
  const { error } = await supabase.from('friend_mutes').delete().eq('user_id', uid).eq('friend_id', friendId)
  return !error
}
