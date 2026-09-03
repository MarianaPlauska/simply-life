/** Trilha AXEL - marcos e histórico local (shared) */

export type AxelHistoryEvent = {
  id: string
  at: string
  kind: 'setup' | 'decision' | 'xp' | 'care' | 'system'
  title: string
  detail?: string
}

export type TrailMilestone = {
  level: number
  title: string
  reward: string
}

export const TRAIL_MILESTONES: TrailMilestone[] = [
  { level: 1, title: 'Despertar', reward: 'Check-in de humor' },
  { level: 3, title: 'Ritmo', reward: 'Ofensiva de 3 dias' },
  { level: 5, title: 'Foco', reward: 'Modo foco desbloqueado' },
  { level: 8, title: 'Estabilidade', reward: 'Coach financeiro' },
  { level: 12, title: 'Círculo', reward: 'Convites de amigos' },
]

export function nextMilestone(level: number): TrailMilestone | null
{
  return TRAIL_MILESTONES.find((m) => m.level > level) ?? null
}

export function appendHistory(
  events: AxelHistoryEvent[],
  event: Omit<AxelHistoryEvent, 'id' | 'at'> & { id?: string; at?: string },
  limit = 80,
): AxelHistoryEvent[]
{
  const row: AxelHistoryEvent = {
    id: event.id ?? `ev_${Date.now()}`,
    at: event.at ?? new Date().toISOString(),
    kind: event.kind,
    title: event.title,
    detail: event.detail,
  }
  return [row, ...events].slice(0, limit)
}
