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

export function startIsoForPeriod(period: 'hoje' | 'semana' | 'mes'): string
{
  const now = new Date()
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  if (period === 'semana') d.setDate(d.getDate() - 6)
  if (period === 'mes') d.setDate(1)
  return d.toISOString()
}

/** Agrupa eventos por kind para o decision log */
export function groupDecisionsByKind(
  events: AxelDecisionEvent[],
): Array<{ kind: AxelDecisionKind; label: string; items: AxelDecisionEvent[] }>
{
  const order: AxelDecisionKind[] = [
    'promoted_hoje',
    'deferred_load',
    'decay_backlog',
    'manual_override',
    'email_ingest',
  ]
  return order
    .map((kind) => ({
      kind,
      label: AXEL_KIND_LABEL[kind],
      items: events.filter((e) => e.kind === kind),
    }))
    .filter((g) => g.items.length > 0)
}
