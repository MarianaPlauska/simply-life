import { randomFriendInviteCode, buildJoinUrl } from './oauthRedirect'

export type FriendsDb = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>
  }
  from: (table: string) => {
    insert: (row: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{
          data: Record<string, unknown> | null
          error: { message: string } | null
        }>
      }
    }
    update: (row: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: { message: string } | null }>
    }
  }
}

export async function createFriendInvite(
  db: FriendsDb,
  origin: string,
): Promise<{ code: string; url: string } | null>
{
  const uid = (await db.auth.getUser()).data.user?.id
  if (!uid) return null

  const code = randomFriendInviteCode()
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const { error } = await db.from('friend_invites').insert({
    code,
    inviter_id: uid,
    expires_at: expires.toISOString(),
    uses_left: 8,
  })

  if (error) return null
  return { code, url: buildJoinUrl(origin, code) }
}

export async function acceptFriendInvite(
  db: FriendsDb,
  code: string,
): Promise<{ ok: boolean; message: string }>
{
  const uid = (await db.auth.getUser()).data.user?.id
  if (!uid) return { ok: false, message: 'Faça login para aceitar o convite' }

  const { data: invite, error } = await db
    .from('friend_invites')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error || !invite)
  {
    return { ok: false, message: 'Convite inválido ou expirado' }
  }

  if (new Date(String(invite.expires_at)) < new Date())
  {
    return { ok: false, message: 'Este convite expirou' }
  }

  if (Number(invite.uses_left) <= 0)
  {
    return { ok: false, message: 'Convite esgotado' }
  }

  if (invite.inviter_id === uid)
  {
    return { ok: false, message: 'Você não pode aceitar o próprio convite' }
  }

  const { error: linkErr } = await db.from('friend_links').insert({
    user_a: invite.inviter_id,
    user_b: uid,
  })

  if (linkErr && !String(linkErr.message).includes('duplicate'))
  {
    return { ok: false, message: linkErr.message }
  }

  await db
    .from('friend_invites')
    .update({ uses_left: Number(invite.uses_left) - 1 })
    .eq('code', String(invite.code))

  return { ok: true, message: 'Você entrou no Círculo!' }
}
