import { parseDueBucketDropId } from '../../lib/dueBucket'
import type { TemporalHorizon } from '../../lib/temporalHorizon'

// Rótulo semântico do drag - prazo vs fila de execução

const EXEC_HORIZONS: TemporalHorizon[] = ['hoje', 'semana', 'backlog']

export function resolveKanbanDragIntent(overId: string | number | null | undefined): string | null
{
  if (overId == null) return null

  const dueBucket = parseDueBucketDropId(overId)
  if (dueBucket)
  {
    return 'Mover prazo'
  }

  if (EXEC_HORIZONS.includes(overId as TemporalHorizon))
  {
    return overId === 'hoje' ? 'Priorizar execução' : 'Mover horizonte'
  }

  return null
}
