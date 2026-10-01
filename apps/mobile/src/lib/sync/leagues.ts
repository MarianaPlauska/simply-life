import type { League, LeagueArea, LeagueMember, LeagueProgress, LeagueType } from '@simply-life/shared'
import { supabase, supabaseConfigured } from '../supabase'
import { appOrigin } from '../appOrigin'
import { apiFetch } from '../apiBase'

type RpcResult = { ok: boolean; message?: string; [k: string]: unknown }

async function rpc(name: string, args: Record<string, unknown>): Promise<RpcResult>
{
  if (!supabaseConfigured) return { ok: false, message: 'Sem conexão com a conta' }
  const { data, error } = await supabase.rpc(name, args)
  if (error)
  {
    const pending = /does not exist|não existe|Could not find/i.test(error.message)
    return { ok: false, message: pending ? 'As ligas ainda não estão ativas no servidor' : error.message }
  }
  return (data ?? { ok: false }) as RpcResult
}

export async function fetchMyLeagues(): Promise<League[]>
{
  if (!supabaseConfigured) return []
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) return []
  const { data: rows, error } = await supabase
    .from('liga_membros')
    .select('liga_id')
    .eq('user_id', uid)
    .is('left_at', null)
  if (error || !rows?.length) return []
  const { data } = await supabase
    .from('ligas')
    .select('id, nome, tipo, area, divisao, created_by, inicio')
    .in('id', rows.map((r) => r.liga_id))
    .eq('status', 'ativa')
  return (data ?? []).map((l) => ({
    id: String(l.id),
    nome: String(l.nome),
    tipo: l.tipo as LeagueType,
    area: l.area as LeagueArea,
    divisao: Number(l.divisao) || 0,
    createdBy: String(l.created_by),
    inicio: String(l.inicio),
  }))
}

export async function fetchLeagueProgress(id: string): Promise<LeagueProgress | null>
{
  const r = await rpc('liga_progress', { p_liga_id: id })
  if (!r.ok) return null
  const last = r.semana_passada as { semana: string; faixa: number; subiu: boolean } | null
  return {
    semana: String(r.semana),
    divisao: Number(r.divisao) || 0,
    membros: Number(r.membros) || 0,
    faixa: r.faixa == null ? null : Number(r.faixa),
    diasRestantes: Number(r.dias_restantes) || 0,
    semanaPassada: last ? { semana: String(last.semana), faixa: Number(last.faixa), subiu: Boolean(last.subiu) } : null,
  }
}

export async function fetchLeagueMembers(id: string): Promise<LeagueMember[]>
{
  if (!supabaseConfigured) return []
  const { data, error } = await supabase.rpc('liga_members_public', { p_liga_id: id })
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map((m) => ({
    userId: String(m.user_id),
    displayName: String(m.display_name),
    accent: String(m.accent),
    avatarStyle: String(m.avatar_style),
    role: m.role === 'owner' ? 'owner' : 'member',
    isMe: Boolean(m.is_me),
  }))
}

export async function createLeague(
  nome: string,
  tipo: LeagueType,
  area: LeagueArea,
): Promise<{ ok: boolean; id?: string; message?: string }>
{
  const r = await rpc('create_liga', { p_nome: nome, p_tipo: tipo, p_area: area })
  return { ok: r.ok, id: r.liga_id ? String(r.liga_id) : undefined, message: r.message }
}

export async function createLeagueInvite(id: string): Promise<{ ok: boolean; url?: string; message?: string }>
{
  const r = await rpc('create_liga_invite', { p_liga_id: id })
  if (!r.ok || !r.code) return { ok: false, message: r.message }
  return { ok: true, url: `${appOrigin().replace(/\/$/, '')}/liga/${String(r.code).toUpperCase()}` }
}

export async function previewLeagueInvite(code: string): Promise<RpcResult>
{
  return rpc('preview_liga_invite', { p_code: code })
}

export async function acceptLeagueInvite(code: string): Promise<{ ok: boolean; id?: string; message?: string }>
{
  const r = await rpc('accept_liga_invite', { p_code: code })
  return { ok: r.ok, id: r.liga_id ? String(r.liga_id) : undefined, message: r.message }
}

export async function leaveLeague(id: string): Promise<boolean>
{
  if (!supabaseConfigured) return false
  const { data, error } = await supabase.rpc('leave_liga', { p_liga_id: id })
  return !error && Boolean(data)
}

/** Grava o meu XP da semana (geral e por área). Nunca lança. */
export async function upsertMyWeekXp(semana: string, values: Record<LeagueArea, number>): Promise<void>
{
  if (!supabaseConfigured) return
  try
  {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user?.id
    if (!uid) return
    const rows = (Object.entries(values) as [LeagueArea, number][]).map(([area, xp]) => ({
      user_id: uid,
      semana,
      area,
      xp: Math.max(0, Math.min(1000, Math.round(xp))),
      updated_at: new Date().toISOString(),
    }))
    await supabase.from('xp_semana').upsert(rows, { onConflict: 'user_id,semana,area' })
  }
  catch
  {
    /* offline ou 073 pendente */
  }
}

/**
 * Pote cheio ou liga que subiu: pede ao servidor o aviso no celular dos outros.
 * O servidor confere no banco e manda uma vez só por semana. Nunca lança.
 */
export async function notifyLeaguePot(id: string): Promise<void>
{
  try
  {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return
    await apiFetch('/api/axel/league-pot', { method: 'POST', token, body: { liga_id: id } })
  }
  catch
  {
    /* sem push: o pote já aparece na liga */
  }
}
