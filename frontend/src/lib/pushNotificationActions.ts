export const PUSH_INLINE_ACTIONS = [
  { action: 'done', title: 'Feito' },
  { action: 'snooze', title: 'Adiar' },
] as const

export interface PushNotificationData
{
  url: string
  tag: string
  kind?: 'med' | 'task' | 'mood' | 'bill'
  clientOnly?: boolean
  interactive?: boolean
  actionToken?: string | null
  taskId?: number | null
  medicamentoId?: number | null
  horario?: string | null
  snoozeKey?: string | null
}

export function buildInteractiveNotificationData(
  base: PushNotificationData,
): PushNotificationData
{
  return {
    ...base,
    clientOnly: true,
    interactive: true,
  }
}

const TASK_SNOOZE_PREFIX = 'simply-life:task-snooze:'

export function markTaskPushSnooze(taskId: number, minutes = 30): void
{
  try
  {
    const until = Date.now() + minutes * 60 * 1000
    localStorage.setItem(`${TASK_SNOOZE_PREFIX}${taskId}`, String(until))
  }
  catch { /* quota */ }
}

export function isTaskPushSnoozed(taskId: number): boolean
{
  try
  {
    const raw = localStorage.getItem(`${TASK_SNOOZE_PREFIX}${taskId}`)
    if (!raw) return false
    const until = Number(raw)
    if (Number.isNaN(until) || until < Date.now())
    {
      localStorage.removeItem(`${TASK_SNOOZE_PREFIX}${taskId}`)
      return false
    }
    return true
  }
  catch
  {
    return false
  }
}
