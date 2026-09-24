import type { AxelDecisionEvent, AxelDecisionKind } from '@simply-life/shared'
import { supabase } from '../supabase'

export type DecisionRow = {
  taskId: string
  kind: AxelDecisionKind
  rationale: string
  batchId: string
  trigger: string
  from: string | null
  to: string | null
}

/** Kinds que existiam antes da migração 058 (fallback se ela ainda não rodou). */
const LEGACY_KIND: Partial<Record<AxelDecisionKind, AxelDecisionKind>> = {
  rescued_overdue: 'promoted_hoje',
  pulled_forward: 'promoted_hoje',
  undo: 'manual_override',
}

function numericTaskId(id: string): number | null
{
  return /^\d+$/.test(id) ? Number(id) : null
}

/** Grava as decisões do Axel. Nunca lança: o histórico não pode travar o quadro. */
export async function insertDecisionEvents(rows: DecisionRow[]): Promise<void>
{
  if (rows.length === 0) return
  try
  {
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (!userId) return

    const full = rows.map((r) => ({
      user_id: userId,
      task_id: numericTaskId(r.taskId),
      kind: r.kind,
      rationale: r.rationale.slice(0, 500),
      horizon: r.to,
      batch_id: r.batchId,
      trigger: r.trigger,
      from_date: r.from,
      to_date: r.to,
    }))
    const { error } = await supabase.from('axel_decision_events').insert(full)
    if (!error) return

    // Migração 058 pendente: grava no formato antigo
    const legacy = rows.map((r) => ({
      user_id: userId,
      task_id: numericTaskId(r.taskId),
      kind: LEGACY_KIND[r.kind] ?? r.kind,
      rationale: `${r.rationale}${r.from || r.to ? ` (${r.from ?? 'sem data'} → ${r.to ?? 'sem data'})` : ''}`.slice(0, 500),
      horizon: r.to,
    }))
    await supabase.from('axel_decision_events').insert(legacy)
  }
  catch
  {
    /* offline: o lote segue na memória local */
  }
}

export async function markBatchUndone(batchId: string, taskIds?: string[]): Promise<void>
{
  try
  {
    let q = supabase
      .from('axel_decision_events')
      .update({ undone_at: new Date().toISOString() })
      .eq('batch_id', batchId)
    const ids = (taskIds ?? []).map(numericTaskId).filter((n): n is number => n != null)
    if (ids.length) q = q.in('task_id', ids)
    await q
  }
  catch
  {
    /* coluna ausente (058 pendente) ou offline */
  }
}

export async function fetchDecisionEvents(sinceIso: string, limit = 80): Promise<AxelDecisionEvent[]>
{
  try
  {
    const { data, error } = await supabase
      .from('axel_decision_events')
      .select('*')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data as AxelDecisionEvent[]
  }
  catch
  {
    return []
  }
}
