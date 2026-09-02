import type { TarefaUnificada } from '../types'
import { dateIsoFromDue, hasClockTime } from './taskDueTime'

export const TIMELINE_DAY_START_HOUR = 6
export const TIMELINE_DAY_END_HOUR = 23
export const TIMELINE_SLOT_MINUTES = 60
export const TIMELINE_DEFAULT_DURATION_MIN = 60

export interface TimelineTimedTask
{
  task: TarefaUnificada
  startMinutes: number
  durationMinutes: number
}

function localTodayKey(d = new Date()): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isTaskDueToday(dataVencimento: string | null, ref = new Date()): boolean
{
  if (!dataVencimento) return false
  return dateIsoFromDue(dataVencimento) === localTodayKey(ref)
}

function minutesFromDue(dataVencimento: string): number
{
  const dt = new Date(dataVencimento)
  if (Number.isNaN(dt.getTime())) return TIMELINE_DAY_START_HOUR * 60
  return dt.getHours() * 60 + dt.getMinutes()
}

export function partitionTodayTimelineTasks(
  tarefas: TarefaUnificada[],
  ref = new Date(),
): { unscheduled: TarefaUnificada[]; timed: TimelineTimedTask[] }
{
  const unscheduled: TarefaUnificada[] = []
  const timed: TimelineTimedTask[] = []

  for (const task of tarefas)
  {
    if (task.status === 'concluida') continue
    if (!isTaskDueToday(task.data_vencimento, ref)) continue

    if (!hasClockTime(task.data_vencimento))
    {
      unscheduled.push(task)
      continue
    }

    timed.push({
      task,
      startMinutes: minutesFromDue(task.data_vencimento as string),
      durationMinutes: TIMELINE_DEFAULT_DURATION_MIN,
    })
  }

  unscheduled.sort((a, b) => (a.score_urgencia ?? 0) - (b.score_urgencia ?? 0))
  timed.sort((a, b) => a.startMinutes - b.startMinutes)

  return { unscheduled, timed }
}

export function timelineHourLabels(): number[]
{
  const hours: number[] = []
  for (let h = TIMELINE_DAY_START_HOUR; h <= TIMELINE_DAY_END_HOUR; h++)
  {
    hours.push(h)
  }
  return hours
}

export function formatTimelineHour(hour: number): string
{
  return `${String(hour).padStart(2, '0')}:00`
}

export function formatTimelineMinutes(totalMinutes: number): string
{
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
