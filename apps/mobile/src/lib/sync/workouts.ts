/**
 * Treino: sessões (sessoes_treino, detalhe JSONB + volume_kg) e rotinas (treino_rotinas, migration 066).
 *
 * Helper público para metas:
 *   workoutSessionsCount(from: string, to: string): Promise<number>
 *     from/to: dias locais 'YYYY-MM-DD', intervalo inclusivo.
 *     Conta sessões finalizadas: no Supabase (logado) + as locais ainda não enviadas.
 *     Convidado ou offline: só as locais. Nunca lança; em erro devolve o que conseguiu contar.
 */
import {
  workoutFromSessaoRow,
  workoutDurationMin,
  workoutSessionsInRange,
  workoutToDetalhe,
  type WorkoutRoutine,
  type WorkoutRoutineExercise,
  type WorkoutSession,
} from '@simply-life/shared'
import { supabase } from '../supabase'
import { readPersisted, writePersisted } from '../persistStorage'

export const WORKOUT_LOCAL_KEY = 'simply-life-workouts-v1'

export type WorkoutLocalSnapshot = {
  sessions: WorkoutSession[]
  routines: WorkoutRoutine[]
  active: WorkoutSession | null
  /** Rotinas apagadas offline que ainda precisam sair do servidor. */
  deletedRoutineIds?: string[]
}

export async function readWorkoutSnapshot(): Promise<WorkoutLocalSnapshot | null>
{
  const raw = await readPersisted(WORKOUT_LOCAL_KEY)
  if (!raw) return null
  try
  {
    const p = JSON.parse(raw) as Partial<WorkoutLocalSnapshot>
    return {
      sessions: Array.isArray(p.sessions) ? p.sessions : [],
      routines: Array.isArray(p.routines) ? p.routines : [],
      active: p.active ?? null,
      deletedRoutineIds: Array.isArray(p.deletedRoutineIds) ? p.deletedRoutineIds : [],
    }
  }
  catch
  {
    return null
  }
}

export async function writeWorkoutSnapshot(snap: WorkoutLocalSnapshot): Promise<void>
{
  await writePersisted(WORKOUT_LOCAL_KEY, JSON.stringify(snap))
}

async function uid(): Promise<string | null>
{
  try
  {
    const { data } = await supabase.auth.getSession()
    return data.session?.user?.id ?? null
  }
  catch
  {
    return null
  }
}

/* ---------------- sessões ---------------- */

/** Histórico completo (sem limite), mais recente primeiro. */
export async function fetchWorkoutSessions(): Promise<WorkoutSession[]>
{
  const id = await uid()
  if (!id) return []
  const out: WorkoutSession[] = []
  const page = 500
  for (let from = 0; ; from += page)
  {
    const { data, error } = await supabase
      .from('sessoes_treino')
      .select('id, tipo_treino, iniciado_em, finalizado_em, created_at, detalhe, volume_kg')
      .eq('user_id', id)
      .not('finalizado_em', 'is', null)
      .order('iniciado_em', { ascending: false })
      .range(from, from + page - 1)
    if (error) throw new Error(error.message)
    for (const row of data ?? [])
    {
      const s = workoutFromSessaoRow(row as Record<string, unknown>)
      if (s) out.push(s)
    }
    if (!data || data.length < page) break
  }
  return out
}

/** Grava a sessão finalizada; idempotente pelo local_id no detalhe. Devolve o id remoto. */
export async function insertWorkoutSession(session: WorkoutSession, habitoId?: string | number | null): Promise<number | null>
{
  const id = await uid()
  if (!id || !session.finishedAt) return null

  const existing = await supabase
    .from('sessoes_treino')
    .select('id')
    .eq('user_id', id)
    .eq('detalhe->>local_id', session.id)
    .limit(1)
    .maybeSingle()
  if (!existing.error && existing.data?.id != null) return Number(existing.data.id)

  const detalhe = workoutToDetalhe(session)
  const dur = workoutDurationMin(session)
  const habit = habitoId != null && /^\d+$/.test(String(habitoId)) ? Number(habitoId) : null
  const { data, error } = await supabase
    .from('sessoes_treino')
    .insert({
      user_id: id,
      habito_id: habit,
      tipo_treino: 'musculacao',
      meta_minutos: Math.max(1, dur),
      iniciado_em: session.startedAt,
      finalizado_em: session.finishedAt,
      duracao_real_min: dur,
      concluido: true,
      volume_kg: detalhe.volume_kg,
      detalhe,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data?.id != null ? Number(data.id) : null
}

export async function deleteWorkoutSession(remoteId: number): Promise<void>
{
  const { error } = await supabase.from('sessoes_treino').delete().eq('id', remoteId)
  if (error) throw new Error(error.message)
}

/* ---------------- rotinas ---------------- */

function mapRoutine(row: Record<string, unknown>): WorkoutRoutine
{
  return {
    id: String(row.local_id ?? row.id),
    remoteId: row.id ? String(row.id) : null,
    name: String(row.nome ?? 'Rotina'),
    exercises: Array.isArray(row.exercicios) ? (row.exercicios as WorkoutRoutineExercise[]) : [],
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? row.created_at ?? ''),
  }
}

export async function fetchWorkoutRoutines(): Promise<WorkoutRoutine[]>
{
  const id = await uid()
  if (!id) return []
  const { data, error } = await supabase
    .from('treino_rotinas')
    .select('*')
    .eq('user_id', id)
    .order('ordem', { ascending: true })
    .order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => mapRoutine(r as Record<string, unknown>))
}

export async function upsertWorkoutRoutine(routine: WorkoutRoutine, ordem = 0): Promise<string | null>
{
  const id = await uid()
  if (!id) return null
  const { data, error } = await supabase
    .from('treino_rotinas')
    .upsert(
      {
        user_id: id,
        local_id: routine.id,
        nome: routine.name,
        exercicios: routine.exercises,
        ordem,
        updated_at: routine.updatedAt || new Date().toISOString(),
      },
      { onConflict: 'user_id,local_id' },
    )
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data?.id ? String(data.id) : null
}

export async function deleteWorkoutRoutine(localId: string): Promise<void>
{
  const id = await uid()
  if (!id) return
  const { error } = await supabase.from('treino_rotinas').delete().eq('user_id', id).eq('local_id', localId)
  if (error) throw new Error(error.message)
}

/* ---------------- metas ---------------- */

function nextDay(iso: string): string
{
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, (m ?? 1) - 1, (d ?? 1) + 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

function localMidnightIso(day: string): string
{
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1).toISOString()
}

/** Quantas sessões de treino finalizadas entre from e to (dias locais YYYY-MM-DD, inclusivo). */
export async function workoutSessionsCount(from: string, to: string): Promise<number>
{
  const snap = await readWorkoutSnapshot().catch(() => null)
  const local = snap?.sessions ?? []
  const id = await uid()
  if (!id) return workoutSessionsInRange(local, from, to).length

  const pending = workoutSessionsInRange(local.filter((s) => s.remoteId == null), from, to).length
  try
  {
    const { count, error } = await supabase
      .from('sessoes_treino')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .not('finalizado_em', 'is', null)
      .gte('iniciado_em', localMidnightIso(from))
      .lt('iniciado_em', localMidnightIso(nextDay(to)))
    if (error) throw error
    return (count ?? 0) + pending
  }
  catch
  {
    return workoutSessionsInRange(local, from, to).length
  }
}
