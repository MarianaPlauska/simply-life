import { randomFriendInviteCode, buildJoinUrl } from './oauthRedirect'

export type FriendsDb = {
  auth: {
    getUser: () => Promise<{ data: { user: { id: string } | null } }>
  }
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
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

/**
 * Aceite atômico no banco (RPC accept_friend_invite, migração 064):
 * trava o convite, cria a amizade em `friendships` (par ordenado) e
 * desconta o uso. Antes, o app gravava em `friend_links`, tabela que não existe.
 */
export async function acceptFriendInvite(
  db: FriendsDb,
  code: string,
): Promise<{ ok: boolean; message: string; friendId?: string }>
{
  const uid = (await db.auth.getUser()).data.user?.id
  if (!uid) return { ok: false, message: 'Faça login para aceitar o convite' }

  const clean = code.trim().toUpperCase()
  if (!clean) return { ok: false, message: 'Convite inválido ou expirado' }

  const { data, error } = await db.rpc('accept_friend_invite', { p_code: clean })
  if (error)
  {
    return { ok: false, message: 'Não deu para aceitar agora. Tente de novo em instantes' }
  }

  const payload = (data ?? null) as { ok?: boolean; message?: string; friend_id?: string } | null
  return {
    ok: Boolean(payload?.ok),
    message: payload?.message ?? 'Não deu para aceitar agora. Tente de novo em instantes',
    friendId: payload?.friend_id ?? undefined,
  }
}
