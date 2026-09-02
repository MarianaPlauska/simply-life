import type { TarefaUnificada } from '../types'
import { hasClockTime } from './taskDueTime'
import { localTodayIso } from './healthDayBoundary'
import { isTaskPushSnoozed } from './pushNotificationActions'

const SENT_PREFIX = 'simply-life:task-notif:'

function sentKey(taskId: number, today: string): string
{
  return `${SENT_PREFIX}${today}:${taskId}`
}

function wasSent(key: string): boolean
{
  try
  {
    return localStorage.getItem(key) === '1'
  }
  catch
  {
    return false
  }
}

function markSent(key: string): void
{
  try
  {
    localStorage.setItem(key, '1')
  }
  catch { /* quota */ }
}

export interface TaskReminderCallbacks
{
  onDue: (tarefa: TarefaUnificada) => void
}

/** Agenda lembrete local no horário do compromisso (hoje) */
export function scheduleTaskReminders(
  tarefas: TarefaUnificada[],
  callbacks: TaskReminderCallbacks,
): () => void
{
  const timeouts: number[] = []
  const now = new Date()
  const today = localTodayIso()

  for (const t of tarefas)
  {
    if (t.status === 'concluida' || !hasClockTime(t.data_vencimento) || !t.data_vencimento)
    {
      continue
    }
    const due = new Date(t.data_vencimento)
    if (Number.isNaN(due.getTime())) continue
    if (due.toDateString() !== now.toDateString()) continue

    const key = sentKey(t.id, today)
    if (wasSent(key) || isTaskPushSnoozed(t.id))
    {
      continue
    }

    const ms = due.getTime() - now.getTime()
    if (ms < 0) continue

    const fire = () =>
    {
      if (wasSent(key)) return
      markSent(key)
      callbacks.onDue(t)
    }

    timeouts.push(window.setTimeout(fire, ms))
  }

  return () =>
  {
    for (const id of timeouts)
    {
      window.clearTimeout(id)
    }
  }
}
