import { supabase } from './supabase'

export type AxelDecisionKind =
  | 'promoted_hoje'
  | 'deferred_load'
  | 'decay_backlog'
  | 'manual_override'
  | 'email_ingest'

export interface AxelDecisionEvent
{
  id: string
  user_id: string
  task_id: number | null
  kind: AxelDecisionKind
  rationale: string | null
  score: number | null
  horizon: string | null
  created_at: string
}

export const AXEL_KIND_LABEL: Record<AxelDecisionKind, string> = {
  promoted_hoje: 'Promovidas para Hoje',
  deferred_load: 'Adiadas por carga',
  decay_backlog: 'Backlog por decay',
  manual_override: 'Override manual',
  email_ingest: 'Ingestão por e-mail',
}

export async function logAxelDecision(entry: {
  taskId?: number | null
  kind: AxelDecisionKind
  rationale?: string | null
  score?: number | null
  horizon?: string | null
}): Promise<void>
{
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  const { error } = await supabase.from('axel_decision_events').insert({
    user_id: session.user.id,
    task_id: entry.taskId ?? null,
    kind: entry.kind,
    rationale: entry.rationale ?? null,
    score: entry.score ?? null,
    horizon: entry.horizon ?? null,
  })

  if (error)
  {
    console.warn('logAxelDecision:', error.message)
  }
}

export async function fetchAxelDecisions(fromIso: string): Promise<AxelDecisionEvent[]>
{
  const { data, error } = await supabase
    .from('axel_decision_events')
    .select('*')
    .gte('created_at', fromIso)
    .order('created_at', { ascending: true })

  if (error)
  {
    console.warn('fetchAxelDecisions:', error.message)
    return []
  }

  return (data || []) as AxelDecisionEvent[]
}

export function startIsoForPeriod(period: 'hoje' | 'semana' | 'mes'): string
{
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === 'semana')
  {
    d.setDate(d.getDate() - 6)
  }
  else if (period === 'mes')
  {
    d.setDate(d.getDate() - 29)
  }
  return d.toISOString()
}

export function countByKind(events: AxelDecisionEvent[]): Record<AxelDecisionKind, number>
{
  const counts: Record<AxelDecisionKind, number> = {
    promoted_hoje: 0,
    deferred_load: 0,
    decay_backlog: 0,
    manual_override: 0,
    email_ingest: 0,
  }
  for (const e of events)
  {
    if (e.kind in counts) counts[e.kind] += 1
  }
  return counts
}

export function stackByDay(events: AxelDecisionEvent[]): Array<Record<string, string | number>>
{
  const map = new Map<string, Record<AxelDecisionKind, number>>()
  for (const e of events)
  {
    const day = e.created_at.slice(0, 10)
    const row = map.get(day) ?? {
      promoted_hoje: 0,
      deferred_load: 0,
      decay_backlog: 0,
      manual_override: 0,
      email_ingest: 0,
    }
    row[e.kind] += 1
    map.set(day, row)
  }

  return [...map.entries()].map(([day, kinds]) => ({
    day: day.slice(5),
    ...kinds,
  }))
}

export function periodCopy(counts: Record<AxelDecisionKind, number>, periodLabel: string): string
{
  const bits: string[] = []
  if (counts.deferred_load)
  {
    bits.push(`adiou ${counts.deferred_load} por carga`)
  }
  if (counts.decay_backlog)
  {
    bits.push(`${counts.decay_backlog} entraram em decay`)
  }
  if (counts.promoted_hoje)
  {
    bits.push(`promoveu ${counts.promoted_hoje} para Hoje`)
  }
  if (counts.manual_override)
  {
    bits.push(`respeitou ${counts.manual_override} ajuste(s) seu(s)`)
  }
  if (bits.length === 0)
  {
    return `${periodLabel} o AXEL ainda não registrou decisões persistidas.`
  }
  return `${periodLabel} o AXEL ${bits.join(', ')}.`
}
