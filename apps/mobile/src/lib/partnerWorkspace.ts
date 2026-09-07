import { supabase } from './supabase'
import { appOrigin } from './appOrigin'

export type PartnerWorkspaceState = {
  workspaceId: string
  role: 'owner' | 'partner'
  partnerUserId: string | null
  partnerDisplayName: string | null
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

export async function fetchPartnerWorkspace(): Promise<PartnerWorkspaceState | null>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null

  const { data: membership, error } = await supabase
    .from('partner_workspace_members')
    .select('workspace_id, role')
    .eq('user_id', uid)
    .maybeSingle()

  if (error || !membership) return null

  const { data: peers } = await supabase
    .from('partner_workspace_members')
    .select('user_id, role')
    .eq('workspace_id', membership.workspace_id)

  const partner = (peers ?? []).find((p) => p.user_id !== uid) ?? null
  let partnerDisplayName: string | null = null

  if (partner)
  {
    const { data: card } = await supabase
      .from('user_public_cards')
      .select('display_name, axel_calls_you')
      .eq('user_id', partner.user_id)
      .maybeSingle()

    partnerDisplayName =
      card?.display_name?.trim()
      || card?.axel_calls_you?.trim()
      || 'Parceiro'
  }

  return {
    workspaceId: String(membership.workspace_id),
    role: membership.role as 'owner' | 'partner',
    partnerUserId: partner?.user_id ?? null,
    partnerDisplayName,
  }
}

export async function createPartnerInvite(): Promise<{ code: string; url: string } | null>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null

  let workspaceId: string | null = null
  const existing = await fetchPartnerWorkspace()

  if (existing)
  {
    if (existing.partnerUserId) return null
    workspaceId = existing.workspaceId
  }
  else
  {
    const { data: ws, error: wsErr } = await supabase
      .from('partner_workspaces')
      .insert({ created_by: uid })
      .select('id')
      .single()

    if (wsErr || !ws) return null
    workspaceId = String(ws.id)

    const { error: memErr } = await supabase
      .from('partner_workspace_members')
      .insert({ workspace_id: workspaceId, user_id: uid, role: 'owner' })

    if (memErr) return null
  }

  const code = randomCode()
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const { error } = await supabase.from('partner_invites').insert({
    code,
    workspace_id: workspaceId,
    inviter_id: uid,
    expires_at: expires.toISOString(),
  })

  if (error) return null

  return { code, url: `${appOrigin()}/parceiro/${code}` }
}

export async function acceptPartnerInvite(code: string): Promise<{ ok: boolean; message: string }>
{
  const { data, error } = await supabase.rpc('accept_partner_invite', { p_code: code })
  if (error)
  {
    return { ok: false, message: 'Não foi possível aceitar o convite' }
  }
  const payload = data as { ok?: boolean; message?: string } | null
  return {
    ok: Boolean(payload?.ok),
    message: payload?.message ?? 'Resposta inesperada',
  }
}
