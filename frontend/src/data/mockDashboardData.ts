import type { TarefaUnificada } from '../types'

// Metadados visuais da linha de execução (contexto + avatar)

export type ExecutionContextKind = 'database' | 'git' | 'mail' | 'docker'

export interface ExecutionRowMeta
{
  context: ExecutionContextKind
  iniciais: string
}

export function getExecutionRowMeta(_taskId: number): ExecutionRowMeta
{
  return { context: 'database', iniciais: 'MC' }
}

/** Pass-through - mantido para compatibilidade; não injeta dados fictícios */
export function mergeDashboardTasks(storeTasks: TarefaUnificada[]): TarefaUnificada[]
{
  return storeTasks
}
