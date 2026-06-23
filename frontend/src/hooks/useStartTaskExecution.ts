import { useCallback } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { resolveTaskEstimate } from '../services/axelTaskEstimateService'
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

    const resolved = await resolveTaskEstimate(tarefa)
    const estimate = getAdjustedEstimateMinutes(
      tarefa.id,
      tarefa.titulo,
      resolved.estimate_minutes,
    )
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

    const iaTag = resolved.source === 'groq'
      ? 'IA · '
      : resolved.iaDisponivel === false
        ? 'Local (configure GROQ_API_KEY no servidor) · '
        : 'Local · '
    pushAiDecision(
      `${iaTag}Foco iniciado (~${estimate} min) — ${resolved.reasoning}`,
    )
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
