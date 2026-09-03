import { getProjectTag } from './contextRationale'
import { calculateUrgency, type RelevanceUrgencyResult } from './relevanceEngine'
import type { TarefaUnificada } from '../types'

// Motor de Orquestração Adaptativa - carga cognitiva + fluxo + velocidade

export const DEFAULT_DAILY_SCORE_CAP = 400

export interface LoadBalanceEntry
{
  snoozed: boolean
  reason?: string
}

export interface AdaptiveUrgencyResult extends RelevanceUrgencyResult
{
  adjustedScore: number
  contextBoost: number
  orchestrationNotes: string[]
}

/** Cap de score diário na coluna HOJE */
export function computeDailyLoadBalancer(
  hojeTasks: TarefaUnificada[],
  cap: number = DEFAULT_DAILY_SCORE_CAP,
  options?: { snoozeReason?: string },
): Map<number, LoadBalanceEntry>
{
  const snoozeReason = options?.snoozeReason ?? 'Excesso de carga para hoje'
  const result = new Map<number, LoadBalanceEntry>()
  const active = hojeTasks.filter((t) => t.status !== 'concluida')
  const sorted = [...active].sort(
    (a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0),
  )

  let sum = 0

  for (const task of sorted)
  {
    const score = task.score_urgencia ?? 0
    if (sum + score <= cap)
    {
      sum += score
      result.set(task.id, { snoozed: false })
    }
    else
    {
      result.set(task.id, {
        snoozed: true,
        reason: snoozeReason,
      })
    }
  }

  for (const task of hojeTasks)
  {
    if (!result.has(task.id))
    {
      result.set(task.id, { snoozed: false })
    }
  }

  return result
}

export function sumHojeScore(hojeTasks: TarefaUnificada[]): number
{
  return hojeTasks
    .filter((t) => t.status !== 'concluida')
    .reduce((acc, t) => acc + (t.score_urgencia ?? 0), 0)
}

/** Multiplicador de contexto - mesma stack/projeto da tarefa em progresso */
export function computeContextBoost(
  task: TarefaUnificada,
  allTasks: TarefaUnificada[],
): { boost: number; note: string | null }
{
  const active = allTasks.find((t) => t.status === 'em_progresso')
  if (!active || active.id === task.id)
  {
    return { boost: 0, note: null }
  }

  const taskTag = getProjectTag(task)
  const activeTag = getProjectTag(active)

  if (taskTag === activeTag && taskTag !== 'GERAL')
  {
    return {
      boost: 8,
      note: 'Prioridade ajustada para evitar sobrecarga de contexto.',
    }
  }

  const taskTitle = task.titulo.toLowerCase()
  const activeTitle = active.titulo.toLowerCase()
  const sharedStack =
    (taskTitle.includes('refator') && activeTitle.includes('refator')) ||
    (taskTitle.includes('kanban') && activeTitle.includes('kanban')) ||
    (taskTitle.includes('drawer') && activeTitle.includes('drawer'))

  if (sharedStack)
  {
    return {
      boost: 5,
      note: 'Prioridade ajustada para manter o mesmo fluxo técnico.',
    }
  }

  return { boost: 0, note: null }
}

export function calculateAdaptiveUrgency(
  task: TarefaUnificada,
  allTasks: TarefaUnificada[],
  sender?: string,
): AdaptiveUrgencyResult
{
  const base = calculateUrgency(task, sender)
  const { boost, note } = computeContextBoost(task, allTasks)
  const orchestrationNotes: string[] = []

  if (note)
  {
    orchestrationNotes.push(note)
  }

  let adjustedScore = Math.min(100, base.score + boost)
  if (base.intent.forceMinScore != null)
  {
    adjustedScore = Math.max(adjustedScore, base.intent.forceMinScore)
  }

  let reason = base.reason
  if (boost > 0)
  {
    reason += ' Reforço por alinhamento com a tarefa em execução.'
  }

  return {
    ...base,
    score: base.score,
    adjustedScore,
    contextBoost: boost,
    orchestrationNotes,
    reason,
  }
}

/** Estimativa ajustada pela velocidade pessoal */
export function applyVelocityToEstimate(
  estimateMinutes: number,
  personalVelocityFactor: number,
): number
{
  const adjusted = estimateMinutes * personalVelocityFactor
  return Math.max(5, Math.min(480, Math.round(adjusted)))
}

export function inferWorkTypeTag(titulo: string): string
{
  const t = titulo.toLowerCase()
  if (t.includes('refator')) return 'refatoracao'
  if (t.includes('bug') || t.includes('erro') || t.includes('fix')) return 'correcao'
  if (t.includes('drawer') || t.includes('ui') || t.includes('frontend')) return 'frontend'
  if (t.includes('api') || t.includes('core') || t.includes('motor')) return 'backend'
  return 'geral'
}
