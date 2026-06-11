import { isTaskDependencyBlocked } from './taskDependencies'
import type { TarefaUnificada } from '../types'

/** Tarefa real acionável para sugestão de execução (ignora mocks de preview e bloqueios). */
export function pickSuggestedExecutionTask(
  tarefas: TarefaUnificada[],
  heroTask: TarefaUnificada | null,
): TarefaUnificada | null
{
  const active = tarefas.filter((t) => t.status !== 'concluida')

  if (
    heroTask &&
    heroTask.id > 0 &&
    heroTask.status !== 'concluida' &&
    !isTaskDependencyBlocked(heroTask, active)
  )
  {
    return heroTask
  }

  const real = active.filter(
    (t) => t.id > 0 && !isTaskDependencyBlocked(t, active),
  )

  if (real.length === 0)
  {
    return null
  }

  return [...real].sort(
    (a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0),
  )[0]
}
