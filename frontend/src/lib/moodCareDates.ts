import { analyzeTaskIntent } from './intentAnalyzer'
import { diffDaysUntilDue } from './daysRemaining'
import type { MoodProfile } from './moodOrchestration'
import type { TarefaUnificada } from '../types'

// Cuidado de humor — adia prazos leves sem pressionar o que é urgente

export const MOOD_CARE_SCORE_MAX = 70
const MOOD_CARE_STORAGE = 'axel-mood-care-due'

export interface MoodCareDueShift
{
  taskId: number
  currentDue: string | null
  nextDue: string
  reason: string
}

function addBusinessDays(from: Date, days: number): Date
{
  const d = new Date(from)
  let added = 0
  while (added < days)
  {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) added++
  }
  d.setHours(17, 0, 0, 0)
  return d
}

function dayKey(now: Date): string
{
  return now.toISOString().slice(0, 10)
}

/** Tarefas que o AXEL não mexe no prazo — urgente, VIP, override do usuário */
export function isProtectedFromMoodCare(task: TarefaUnificada): boolean
{
  if (task.horizon_override) return true
  if ((task.score_urgencia ?? 0) > MOOD_CARE_SCORE_MAX) return true
  return analyzeTaskIntent(task).forceMinScore != null
}

function loadStore(): Record<string, boolean>
{
  try
  {
    const raw = sessionStorage.getItem(MOOD_CARE_STORAGE)
    return raw ? JSON.parse(raw) as Record<string, boolean> : {}
  }
  catch
  {
    return {}
  }
}

/** IDs já cuidados hoje — evita empurrar o mesmo prazo em loop */
export function loadMoodCareShiftedIds(now: Date = new Date()): Set<number>
{
  const prefix = `${dayKey(now)}:`
  const ids = new Set<number>()
  for (const key of Object.keys(loadStore()))
  {
    if (!key.startsWith(prefix)) continue
    const id = Number(key.slice(prefix.length))
    if (Number.isFinite(id)) ids.add(id)
  }
  return ids
}

export function markMoodCareShifted(taskId: number, now: Date = new Date()): void
{
  try
  {
    const store = loadStore()
    store[`${dayKey(now)}:${taskId}`] = true
    sessionStorage.setItem(MOOD_CARE_STORAGE, JSON.stringify(store))
  }
  catch
  {
    /* privado / SSR */
  }
}

/**
 * Adia vencimento de hoje/atrasado quando o humor pede recuperação.
 * Não toca urgente, VIP nem override manual.
 */
export function computeMoodCareDueShifts(
  tasks: TarefaUnificada[],
  profile: MoodProfile,
  options?: { now?: Date; skipIds?: Set<number> },
): MoodCareDueShift[]
{
  if (profile !== 'recuperacao' && profile !== 'cuidado')
  {
    return []
  }

  const now = options?.now ?? new Date()
  const skipIds = options?.skipIds ?? new Set<number>()
  const extraDays = profile === 'recuperacao' ? 2 : 1
  const shifts: MoodCareDueShift[] = []

  for (const task of tasks)
  {
    if (task.id <= 0 || task.status === 'concluida') continue
    if (skipIds.has(task.id) || isProtectedFromMoodCare(task)) continue

    const diff = diffDaysUntilDue(task.data_vencimento, now)
    if (diff === null || diff > 0) continue

    const next = addBusinessDays(now, extraDays)
    const nextDue = next.toISOString()
    if (task.data_vencimento && diffDaysUntilDue(nextDue, now) === diff)
    {
      continue
    }

    shifts.push({
      taskId: task.id,
      currentDue: task.data_vencimento,
      nextDue,
      reason: profile === 'recuperacao'
        ? 'Humor pede recuperação — prazo leve adiado dois dias úteis.'
        : 'Humor pede cuidado — prazo leve adiado um dia útil.',
    })
  }

  return shifts
}

export function applyMoodCareDueShifts(
  tasks: TarefaUnificada[],
  shifts: MoodCareDueShift[],
): TarefaUnificada[]
{
  if (shifts.length === 0) return tasks
  const byId = new Map(shifts.map((s) => [s.taskId, s.nextDue]))
  return tasks.map((task) =>
  {
    const nextDue = byId.get(task.id)
    return nextDue ? { ...task, data_vencimento: nextDue } : task
  })
}
