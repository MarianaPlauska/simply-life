import { DueBucketBoard } from './DueBucketBoard'
import type { TarefaUnificada } from '../../types'

interface KanbanHorizonDesktopProps
{
  tarefas: TarefaUnificada[]
  executionQueueIds: Set<number>
  executingId: number | null
  activeId: number | null
  onOpen: (task: TarefaUnificada) => void
  onStartExecute?: (task: TarefaUnificada) => void
}

/** Board desktop - colunas de prazo em largura fixa, overflow-x se sobrar espaço */
export function KanbanHorizonDesktop({
  tarefas,
  executionQueueIds,
  executingId,
  activeId,
  onOpen,
  onStartExecute,
}: KanbanHorizonDesktopProps)
{
  return (
    <DueBucketBoard
      layout="columns"
      tarefas={tarefas}
      executionQueueIds={executionQueueIds}
      executingId={executingId}
      activeId={activeId}
      onOpen={onOpen}
      onStartExecute={onStartExecute}
    />
  )
}
