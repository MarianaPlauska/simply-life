export type HomeMetricId =
  | 'humor'
  | 'sleep'
  | 'water'
  | 'protein'
  | 'tasks'
  | 'finance'
  | 'goals'
  | 'stats'

export const HOME_METRIC_CATALOG: {
  id: HomeMetricId
  label: string
  hint: string
  glanceId: string
}[] = [
  { id: 'humor', label: 'Humor', hint: 'Check-in do dia', glanceId: 'g-humor' },
  { id: 'sleep', label: 'Sono', hint: 'Manhã — horas da noite', glanceId: 'g-sono' },
  { id: 'water', label: 'Água', hint: 'Copos / meta', glanceId: 'g-agua' },
  { id: 'protein', label: 'Proteína', hint: 'Gramas do dia', glanceId: 'g-proteina' },
  { id: 'tasks', label: 'Tarefas', hint: 'Em aberto', glanceId: 'g-tasks' },
  { id: 'finance', label: 'Gastos', hint: 'Mês + sparkline', glanceId: 'g-finance' },
  { id: 'goals', label: 'Metas do dia', hint: 'Feitas / total', glanceId: 'g-goals' },
  { id: 'stats', label: 'Desempenho', hint: 'Estatísticas e evolução semanal', glanceId: 'g-stats' },
]

export const DEFAULT_HOME_METRICS: HomeMetricId[] = ['humor', 'sleep', 'water', 'tasks']

const VALID = new Set<HomeMetricId>(HOME_METRIC_CATALOG.map((c) => c.id))

export function normalizeHomeMetrics(ids: HomeMetricId[] | undefined | null): HomeMetricId[]
{
  if (!ids?.length) return [...DEFAULT_HOME_METRICS]
  const out: HomeMetricId[] = []
  for (const id of ids)
  {
    if (VALID.has(id) && !out.includes(id))
    {
      out.push(id)
    }
  }
  return out.length > 0 ? out : [...DEFAULT_HOME_METRICS]
}

export function toggleHomeMetric(
  current: HomeMetricId[],
  id: HomeMetricId,
): HomeMetricId[]
{
  if (current.includes(id))
  {
    const next = current.filter((x) => x !== id)
    return next.length > 0 ? next : current
  }
  return [...current, id]
}
