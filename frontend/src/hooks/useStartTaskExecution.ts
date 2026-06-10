import { useCallback } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import type { TarefaUnificada } from '../types'

// Iniciar execução — timer + status em progresso (card ou drawer)

export function useStartTaskExecution()
{
  const startExecution = useTaskStore((s) => s.startExecution)
  const getAdjustedEstimateMinutes = useTaskStore((s) => s.getAdjustedEstimateMinutes)
  const moveTask = useTaskStore((s) => s.moveTask)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)

  const startTask = useCallback(async (tarefa: TarefaUnificada) =>
  {
    if (!tarefa.id || tarefa.status === 'concluida') return

    const estimate = getAdjustedEstimateMinutes(tarefa.id, tarefa.titulo)
    startExecution(tarefa.id, estimate)
    moveTask(tarefa.id, 'em_progresso')

    if (tarefa.id > 0)
    {
      await updateTarefa(tarefa.id, { status: 'em_progresso' })
    }
    else
    {
      patchTarefaLocal(tarefa.id, { status: 'em_progresso' })
    }

    pushAiDecision('Sessão de foco iniciada — contexto preservado no quadro.')
  }, [
    startExecution,
    getAdjustedEstimateMinutes,
    moveTask,
    updateTarefa,
    patchTarefaLocal,
    pushAiDecision,
  ])

  return { startTask }
}
