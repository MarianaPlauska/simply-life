import type { TarefaUnificada } from '../types'

// Alertas globais — prazos nas próximas 48h (2 dias)

const HOUR_MS = 3_600_000
const TASK_DUE_ALERT_HOURS = 48

export function getOverdueTasks(tarefas: TarefaUnificada[]): TarefaUnificada[]
{
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  return tarefas.filter((t) =>
  {
    if (t.status === 'concluida' || !t.data_vencimento) return false
    const due = new Date(t.data_vencimento)
    if (Number.isNaN(due.getTime())) return false
    return due.getTime() < todayStart.getTime()
  })
}

export function countOverdueTasks(tarefas: TarefaUnificada[]): number
{
  return getOverdueTasks(tarefas).length
}

export function countUrgentDeadlines(tarefas: TarefaUnificada[]): number
{
  const now = Date.now()
  const limit = now + TASK_DUE_ALERT_HOURS * HOUR_MS

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
  const limit = now + TASK_DUE_ALERT_HOURS * HOUR_MS

  return tarefas.filter((t) =>
  {
    if (t.status === 'concluida' || !t.data_vencimento) return false
    const due = new Date(t.data_vencimento).getTime()
    return due > now && due <= limit
  })
}
