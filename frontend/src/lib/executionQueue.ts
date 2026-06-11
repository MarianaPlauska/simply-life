import { bucketByTemporalHorizon, type TemporalHorizon } from './temporalHorizon'
import type { TarefaUnificada } from '../types'

// Fila WIP "Executar agora" — ortogonal ao DueBucket (prazo)

/** IDs ordenados por score na fila de execução (derivado do horizonte hoje até Fase 2). */
export function deriveExecutionQueue(
  tarefas: TarefaUnificada[],
  horizonOverrides: Record<number, TemporalHorizon> = {},
): TarefaUnificada[]
{
  const buckets = bucketByTemporalHorizon(tarefas, horizonOverrides)

  return buckets.hoje
    .filter((t) => t.status !== 'concluida')
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
}

export function deriveExecutionQueueIds(
  tarefas: TarefaUnificada[],
  horizonOverrides: Record<number, TemporalHorizon> = {},
): Set<number>
{
  return new Set(deriveExecutionQueue(tarefas, horizonOverrides).map((t) => t.id))
}
