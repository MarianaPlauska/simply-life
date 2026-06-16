import { bucketByTemporalHorizon, type TemporalHorizon } from './temporalHorizon'
import type { TarefaUnificada } from '../types'

// Fila WIP "Executar agora" — ortogonal ao DueBucket (prazo)

/** IDs ordenados por score na fila de execução; pins fixos no topo. */
export function deriveExecutionQueue(
  tarefas: TarefaUnificada[],
  horizonOverrides: Record<number, TemporalHorizon> = {},
  pinnedIds: number[] = [],
): TarefaUnificada[]
{
  const buckets = bucketByTemporalHorizon(tarefas, horizonOverrides)

  const base = buckets.hoje
    .filter((t) => t.status !== 'concluida')
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))

  const pinnedSet = new Set(pinnedIds)
  const pinned = pinnedIds
    .map((id) => tarefas.find((t) => t.id === id))
    .filter((t): t is TarefaUnificada => !!t && t.status !== 'concluida')
  const rest = base.filter((t) => !pinnedSet.has(t.id))

  return [...pinned, ...rest]
}

export function deriveExecutionQueueIds(
  tarefas: TarefaUnificada[],
  horizonOverrides: Record<number, TemporalHorizon> = {},
  pinnedIds: number[] = [],
): Set<number>
{
  return new Set(deriveExecutionQueue(tarefas, horizonOverrides, pinnedIds).map((t) => t.id))
}
