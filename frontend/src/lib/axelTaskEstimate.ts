import type { Subtarefa, TarefaUnificada } from '../types'

const MIN_ESTIMATE = 20
const MAX_ESTIMATE = 480
/** Janela útil de trabalho no dia - referência para estimativas */
export const AXEL_WORKDAY_MINUTES = 14 * 60

export interface TaskComplexityInput
{
  titulo: string
  subtarefas?: Subtarefa[]
  activityEntryCount?: number
  descricao?: string | null
  prioridade?: TarefaUnificada['prioridade']
}

/** Fallback local - espelha backend/logic/task_estimate.py; preferir /api/task-estimate */
export function inferComplexityEstimateMinutes(input: TaskComplexityInput): number
{
  const subs = input.subtarefas ?? []
  const pending = subs.filter((s) => !s.concluida).length
  const done = subs.length - pending
  const descLen = (input.descricao ?? input.titulo ?? '').trim().length

  let mins = 28
  mins += subs.length * 14
  mins += pending * 6
  mins += (input.activityEntryCount ?? 0) * 5
  mins += Math.floor(descLen / 100) * 4

  if (done > 0 && subs.length > 0)
  {
    const ratio = done / subs.length
    mins = Math.round(mins * (1 - ratio * 0.35))
  }

  if (input.prioridade === 'critica')
  {
    mins = Math.round(mins * 1.12)
  }
  else if (input.prioridade === 'alta')
  {
    mins = Math.round(mins * 1.06)
  }

  return Math.max(MIN_ESTIMATE, Math.min(MAX_ESTIMATE, Math.min(mins, AXEL_WORKDAY_MINUTES)))
}

export function inferComplexityFromTask(
  task: TarefaUnificada,
  activityEntryCount = 0,
): number
{
  return inferComplexityEstimateMinutes({
    titulo: task.titulo,
    subtarefas: task.subtarefas,
    activityEntryCount,
    descricao: task.notas_locais ?? task.descricao,
    prioridade: task.prioridade,
  })
}

/**
 * Progresso de foco - tempo sozinho não dispara a barra;
 * checklist e complexidade modulam o ritmo.
 */
export function computeAxelFocusProgress(
  elapsedSec: number,
  estimateMin: number,
  task: TarefaUnificada,
): number
{
  if (estimateMin <= 0) return 0

  const rawTime = elapsedSec / (estimateMin * 60)
  const subs = task.subtarefas ?? []
  const checklist = subs.length > 0
    ? subs.filter((s) => s.concluida).length / subs.length
    : 0

  const complexityCeiling = 0.2 + checklist * 0.55 + Math.min(0.2, subs.length * 0.04)
  const blended = rawTime * 0.45 + checklist * 0.4
  const capped = Math.min(blended, complexityCeiling + rawTime * 0.25)

  return Math.max(0, Math.min(0.98, capped))
}

export function formatEstimateHint(minutes: number): string
{
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `~${h}h ${m}min` : `~${h}h`
}
