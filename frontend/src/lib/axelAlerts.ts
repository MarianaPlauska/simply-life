import type { TarefaUnificada } from '../types'

// Alertas globais — prazos nas próximas 24h

const HOUR_MS = 3_600_000

export function countUrgentDeadlines(tarefas: TarefaUnificada[]): number
{
  const now = Date.now()
  const limit = now + 24 * HOUR_MS

  return tarefas.filter((t) =>
  {
    if (t.status === 'concluida' || !t.data_vencimento) return false
    const due = new Date(t.data_vencimento).getTime()
    return due > now && due <= limit
  }).length
}

export function getUrgentDeadlineTasks(tarefas: TarefaUnificada[]): TarefaUnificada[]
{
  const now = Date.now()
  const limit = now + 24 * HOUR_MS

  return tarefas.filter((t) =>
  {
    if (t.status === 'concluida' || !t.data_vencimento) return false
    const due = new Date(t.data_vencimento).getTime()
    return due > now && due <= limit
  })
}
