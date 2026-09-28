/**
 * Metas juntos: acesso ao Supabase (migração 064).
 * Tudo que é do grupo passa por RPC. As contribuições (shared_goal_entries)
 * só o dono lê e escreve; o progresso do grupo vem de shared_goal_progress,
 * que devolve só faixa ou ritmo.
 */
import {
  sharedGoalFromRow,
  sharedGoalProgressFromRpc,
  type SharedGoal,
  type SharedGoalCheer,
  type SharedGoalCheerKey,
  type SharedGoalDraft,
  type SharedGoalMemberCard,
  type SharedGoalProgress,
} from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'
import { appOrigin } from '../appOrigin'
import { apiFetch } from '../apiBase'

export type RpcResult<T = Record<string, unknown>> = { ok: boolean; message?: string } & Partial<T>

export type MyGoalMembership = {
  goalId: string
  muted: boolean
  role: 'owner' | 'member'
}

export type GoalInvitePreview = {
  titulo: string
  metrica: string
  unidade: string
  alvo: number
  modo: 'pote' | 'cada_um'
  exibicao: 'faixas' | 'ritmo'
  inicio: string
  fim: string | null
  ciclo: 'semanal' | 'total'
  inviterName: string
  members: number
  alreadyMember: boolean
}

const FALLBACK = 'Não deu agora. Tente de novo em instantes'

async function rpc<T = Record<string, unknown>>(fn: string, args: Record<string, unknown>): Promise<RpcResult<T>>
{
  if (!supabaseConfigured) return { ok: false, message: 'Sem conexão com o servidor' } as RpcResult<T>
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return { ok: false, message: FALLBACK } as RpcResult<T>
  const payload = (data ?? {}) as RpcResult<T>
  return { ...payload, ok: Boolean(payload.ok) }
}

async function currentUid(): Promise<string | null>
{
  if (!supabaseConfigured) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

export function goalInviteUrl(code: string): string
{
  return `${appOrigin().replace(/\/$/, '')}/meta/${code.toUpperCase()}`
}

/** Metas em que estou (ativas e encerradas recentes), com meu silenciar */
export async function fetchMyGoals(): Promise<{ goals: SharedGoal[]; memberships: MyGoalMembership[] }>
{
  const uid = await currentUid()
  if (!uid) return { goals: [], memberships: [] }

  const { data: rows, error } = await supabase
    .from('shared_goal_members')
    .select('goal_id, muted, role, left_at')
    .eq('user_id', uid)
    .is('left_at', null)

  if (error) throw new Error(error.message)
  const memberships: MyGoalMembership[] = (rows ?? []).map((r) => ({
    goalId: String(r.goal_id),
    muted: Boolean(r.muted),
    role: r.role === 'owner' ? 'owner' : 'member',
  }))
  if (memberships.length === 0) return { goals: [], memberships }

  const { data: goals, error: gErr } = await supabase
    .from('shared_goals')
    .select('*')
    .in('id', memberships.map((m) => m.goalId))
    .order('created_at', { ascending: false })

  if (gErr) throw new Error(gErr.message)
  return { goals: (goals ?? []).map((g) => sharedGoalFromRow(g as Record<string, unknown>)), memberships }
}

export async function fetchGoalProgress(goalId: string): Promise<SharedGoalProgress | null>
{
  if (!supabaseConfigured) return null
  const { data, error } = await supabase.rpc('shared_goal_progress', { p_goal_id: goalId })
  if (error) return null
  return sharedGoalProgressFromRpc(data)
}

export async function fetchGoalMembers(goalId: string): Promise<SharedGoalMemberCard[]>
{
  if (!supabaseConfigured) return []
  const { data, error } = await supabase.rpc('shared_goal_members_public', { p_goal_id: goalId })
  if (error) return []
  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    userId: String(r.user_id),
    displayName: String(r.display_name ?? 'Alguém'),
    accent: String(r.accent ?? ''),
    avatarStyle: String(r.avatar_style ?? 'initials'),
    role: r.role === 'owner' ? 'owner' : 'member',
    isMe: Boolean(r.is_me),
  }))
}

export async function fetchGoalCheers(goalId: string, limit = 20): Promise<SharedGoalCheer[]>
{
  if (!supabaseConfigured) return []
  const { data, error } = await supabase
    .from('shared_goal_cheers')
    .select('id, goal_id, from_user, preset_key, created_at')
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return (data ?? []).map((r) => ({
    id: Number(r.id),
    goalId: String(r.goal_id),
    fromUser: String(r.from_user),
    presetKey: String(r.preset_key) as SharedGoalCheerKey,
    createdAt: String(r.created_at),
  }))
}

/** Minhas contribuições (só eu leio) no intervalo, por dia */
export async function fetchMyEntries(goalId: string, from: string, to: string): Promise<Record<string, number>>
{
  const uid = await currentUid()
  if (!uid) return {}
  const { data, error } = await supabase
    .from('shared_goal_entries')
    .select('dia, valor')
    .eq('goal_id', goalId)
    .eq('user_id', uid)
    .gte('dia', from)
    .lte('dia', to)
  if (error) return {}
  const out: Record<string, number> = {}
  for (const r of data ?? []) out[String(r.dia).slice(0, 10)] = Number(r.valor)
  return out
}

export async function upsertMyEntries(goalId: string, days: Record<string, number>): Promise<boolean>
{
  const uid = await currentUid()
  if (!uid) return false
  const rows = Object.entries(days).map(([dia, valor]) => ({
    goal_id: goalId,
    user_id: uid,
    dia,
    valor: Math.max(0, Math.round(valor * 100) / 100),
  }))
  if (rows.length === 0) return true
  const { error } = await supabase
    .from('shared_goal_entries')
    .upsert(rows, { onConflict: 'goal_id,user_id,dia' })
  return !error
}

export async function createSharedGoal(d: SharedGoalDraft): Promise<RpcResult<{ goal_id: string }>>
{
  return rpc<{ goal_id: string }>('create_shared_goal', {
    p_titulo: d.titulo.trim(),
    p_metrica: d.metrica,
    p_unidade: d.unidade.trim(),
    p_alvo: d.alvo,
    p_modo_contagem: d.modo,
    p_exibicao: d.exibicao,
    p_inicio: d.inicio,
    p_fim: d.fim,
    p_ciclo: d.ciclo,
  })
}

export async function createGoalInvite(goalId: string): Promise<{ ok: boolean; message?: string; code?: string; url?: string }>
{
  const r = await rpc<{ code: string }>('create_shared_goal_invite', { p_goal_id: goalId })
  if (!r.ok || !r.code) return { ok: false, message: r.message ?? FALLBACK }
  return { ok: true, code: r.code, url: goalInviteUrl(r.code) }
}

export async function previewGoalInvite(code: string): Promise<{ ok: boolean; message?: string; preview?: GoalInvitePreview }>
{
  const r = await rpc<Record<string, unknown>>('preview_goal_invite', { p_code: code.trim().toUpperCase() })
  if (!r.ok) return { ok: false, message: r.message ?? 'Convite inválido ou expirado' }
  const x = r as Record<string, unknown>
  return {
    ok: true,
    preview: {
      titulo: String(x.titulo ?? ''),
      metrica: String(x.metrica ?? 'livre'),
      unidade: String(x.unidade ?? ''),
      alvo: Number(x.alvo ?? 0),
      modo: x.modo_contagem === 'cada_um' ? 'cada_um' : 'pote',
      exibicao: x.exibicao === 'ritmo' ? 'ritmo' : 'faixas',
      inicio: String(x.inicio ?? ''),
      fim: x.fim ? String(x.fim) : null,
      ciclo: x.ciclo === 'semanal' ? 'semanal' : 'total',
      inviterName: String(x.inviter_name ?? 'Alguém'),
      members: Number(x.members ?? 1),
      alreadyMember: Boolean(x.already_member),
    },
  }
}

export async function acceptGoalInvite(code: string): Promise<RpcResult<{ goal_id: string }>>
{
  return rpc<{ goal_id: string }>('accept_goal_invite', { p_code: code.trim().toUpperCase() })
}

export async function leaveSharedGoal(goalId: string): Promise<boolean>
{
  return (await rpc('leave_shared_goal', { p_goal_id: goalId })).ok
}

export async function setSharedGoalMuted(goalId: string, muted: boolean): Promise<boolean>
{
  return (await rpc('set_shared_goal_muted', { p_goal_id: goalId, p_muted: muted })).ok
}

/**
 * Apoio pronto: o banco checa preset e limite (3 por dia); a API da Vercel
 * avisa os outros por push, respeitando silêncio e horário.
 */
export async function sendSharedGoalCheer(goalId: string, preset: SharedGoalCheerKey): Promise<RpcResult<{ cheer_id: number; left_today: number }>>
{
  const r = await rpc<{ cheer_id: number; left_today: number }>('send_shared_goal_cheer', {
    p_goal_id: goalId,
    p_preset_key: preset,
  })
  if (r.ok && r.cheer_id)
  {
    void notifyCheer(Number(r.cheer_id))
  }
  return r
}

async function notifyCheer(cheerId: number): Promise<void>
{
  try
  {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    await apiFetch('/api/axel/shared-goal-cheer', {
      method: 'POST',
      token,
      body: { cheer_id: cheerId },
    })
  }
  catch
  {
    /* sem push: o apoio já aparece na meta */
  }
}
