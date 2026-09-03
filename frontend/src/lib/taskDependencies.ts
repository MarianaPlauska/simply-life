import type { TarefaUnificada } from '../types'

// Soft lock - dependências até predecessor estar DONE (concluída)

export function isTaskDependencyBlocked(
  task: TarefaUnificada,
  allTasks: TarefaUnificada[],
): boolean
{
  const deps = task.blockedBy ?? []
  if (deps.length === 0) return false

  const byId = new Map(allTasks.map((t) => [String(t.id), t]))

  for (const depId of deps)
  {
    const predecessor = byId.get(String(depId))
    if (!predecessor || predecessor.status !== 'concluida')
    {
      return true
    }
  }

  return false
}
