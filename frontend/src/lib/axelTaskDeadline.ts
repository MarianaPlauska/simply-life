import { resolveTaskEstimate } from '../services/axelTaskEstimateService'
import { useTaskStore } from '../store/useTaskStore'
import type { TarefaUnificada } from '../types'

/** Usuário sinalizou dificuldade — AXEL estende prazo e recalibra estimativa */
export async function axelExtendTaskDeadline(task: TarefaUnificada): Promise<number>
{
  const store = useTaskStore.getState()
  const elapsedMin = Math.floor(store.getTaskElapsedSeconds(task.id) / 60)
  const resolved = await resolveTaskEstimate(task, 0, elapsedMin, true)
  const days = resolved.extension_days

  const base = task.data_vencimento ? new Date(task.data_vencimento) : new Date()
  base.setDate(base.getDate() + days)
  const nextDue = base.toISOString()

  if (task.id > 0)
  {
    await store.updateTarefa(task.id, { data_vencimento: nextDue })
  }

  store.pushAiDecision(
    `Prazo +${days} dias — ${resolved.reasoning}`,
  )

  void store.refreshTaskEstimateFromTask(
    { ...task, data_vencimento: nextDue },
    0,
    { difficultySignal: true },
  )

  return days
}
