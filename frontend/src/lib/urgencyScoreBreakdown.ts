import { calculateAdaptiveUrgency } from './adaptiveOrchestration'
import type { TarefaUnificada } from '../types'
import type { RelevanceUrgencyLog } from './relevanceEngine'

// Score Breakdown — Motor de Relevância ORION (40/40/20)

export type ScoreFactorId = 'influence' | 'semantic' | 'deadline'

export interface ScoreFactor
{
  id: ScoreFactorId
  label: string
  pct: number
  points: number
  maxPoints: number
}

export interface ScoreBreakdown
{
  total: number
  reason: string
  log: RelevanceUrgencyLog
  factors: ScoreFactor[]
}

const FACTOR_LABELS: Record<ScoreFactorId, string> = {
  influence: 'Influência do Remetente',
  semantic: 'Densidade Semântica',
  deadline: 'Proximidade do Prazo',
}

export function computeScoreBreakdown(
  tarefa: TarefaUnificada,
  allTasks: TarefaUnificada[] = [tarefa],
): ScoreBreakdown
{
  const relevance = calculateAdaptiveUrgency(tarefa, allTasks)
  const { log } = relevance

  const factors: ScoreFactor[] = [
    {
      id: 'influence',
      label: FACTOR_LABELS.influence,
      pct: Math.round(log.influenceWeight * 100),
      points: log.components.influence,
      maxPoints: 40,
    },
    {
      id: 'semantic',
      label: FACTOR_LABELS.semantic,
      pct: log.semanticScore,
      points: log.components.semantic,
      maxPoints: 40,
    },
    {
      id: 'deadline',
      label: FACTOR_LABELS.deadline,
      pct: log.deadlineFactor,
      points: log.components.deadline,
      maxPoints: 20,
    },
  ]

  const total = tarefa.score_urgencia ?? relevance.adjustedScore
  const reason =
    tarefa.urgency_reason ??
    relevance.intent.urgencyReason ??
    tarefa.score_reason ??
    relevance.reason

  return {
    total,
    reason,
    log,
    factors,
  }
}
