import {
  DEFAULT_INFLUENCE_MAP,
  formatSenderLabel,
  resolveInfluenceWeight,
} from './influenceMap'
import { analyzeTaskIntent, type IntentAnalysis } from './intentAnalyzer'
import type { TarefaUnificada } from '../types'

// Motor de Relevância ORION — influência social + densidade semântica + prazo

const HIGH_PRIORITY_TERMS = [
  { term: 'urgente', label: 'Urgência' },
  { term: 'bloqueio', label: 'Bloqueio' },
  { term: 'bloqueado', label: 'Bloqueio' },
  { term: 'erro', label: 'Erro' },
  { term: 'critico', label: 'Crítico' },
  { term: 'crítico', label: 'Crítico' },
  { term: 'falha', label: 'Falha' },
  { term: 'incidente', label: 'Incidente' },
  { term: 'p0', label: 'Prioridade P0' },
  { term: 'hotfix', label: 'Hotfix' },
] as const

const LOW_PRIORITY_TERMS = [
  { term: 'sugestão', label: 'Sugestão' },
  { term: 'sugestao', label: 'Sugestão' },
  { term: 'consulta', label: 'Consulta' },
  { term: 'falar', label: 'Conversa' },
  { term: 'ideia', label: 'Ideia' },
  { term: 'quando puder', label: 'Baixa pressa' },
  { term: 'fyi', label: 'Informativo' },
] as const

export interface SemanticAnalysis
{
  score: number
  matchedHigh: string[]
  matchedLow: string[]
}

export interface RelevanceUrgencyLog
{
  influenceWeight: number
  influenceLabel: string
  semanticScore: number
  semanticTerms: string[]
  deadlineFactor: number
  components: {
    influence: number
    semantic: number
    deadline: number
  }
}

export interface RelevanceUrgencyResult
{
  score: number
  reason: string
  log: RelevanceUrgencyLog
  intent: IntentAnalysis
}

/** Análise semântica básica do título (0–100) */
export function analyzeTitle(title: string): SemanticAnalysis
{
  const text = String(title || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')

  let score = 45
  const matchedHigh: string[] = []
  const matchedLow: string[] = []

  for (const { term, label } of HIGH_PRIORITY_TERMS)
  {
    if (text.includes(term))
    {
      matchedHigh.push(label)
      score = Math.max(score, 85)
    }
  }

  for (const { term, label } of LOW_PRIORITY_TERMS)
  {
    if (text.includes(term))
    {
      matchedLow.push(label)
      score = Math.min(score, 35)
    }
  }

  if (matchedHigh.length > 1)
  {
    score = Math.min(100, score + matchedHigh.length * 5)
  }

  if (matchedHigh.length === 0 && matchedLow.length > 0)
  {
    score = Math.max(15, 28 - matchedLow.length * 4)
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    matchedHigh,
    matchedLow,
  }
}

/** Fator de prazo 0–100 */
export function computeDeadlineFactor(dueIso: string | null | undefined): number
{
  if (!dueIso) return 25

  const hours = (new Date(dueIso).getTime() - Date.now()) / 3_600_000

  if (hours < 0) return 100
  if (hours < 4) return 95
  if (hours < 24) return 82
  if (hours < 72) return 58
  if (hours < 168) return 38
  return 18
}

export function resolveTaskSender(task: TarefaUnificada, senderOverride?: string): string
{
  return senderOverride ?? task.remetente ?? task.origem ?? ''
}

/**
 * score = (influência × 40) + (semântica × 40) + (prazo × 20)
 */
export function calculateUrgency(
  task: TarefaUnificada,
  sender?: string,
  options?: { influenceMap?: Record<string, number> },
): RelevanceUrgencyResult
{
  const map = options?.influenceMap ?? DEFAULT_INFLUENCE_MAP
  const remetente = resolveTaskSender(task, sender)

  const intent = analyzeTaskIntent(task, remetente)
  const influenceWeight = resolveInfluenceWeight(remetente, map)
  const semantic = analyzeTitle(task.titulo)
  const semanticNorm = semantic.score / 100
  const deadlineFactor = intent.ignoreDeadline
    ? 0
    : computeDeadlineFactor(task.data_vencimento)

  const influencePts = influenceWeight * 40
  const semanticPts = semanticNorm * 40
  const deadlinePts = intent.ignoreDeadline ? 0 : (deadlineFactor / 100) * 20

  let score = Math.min(
    100,
    Math.max(0, Math.round(influencePts + semanticPts + deadlinePts)),
  )

  if (intent.forceMinScore != null)
  {
    score = Math.max(score, intent.forceMinScore)
  }

  const senderLabel = formatSenderLabel(remetente)
  const termLabel =
    semantic.matchedHigh[0] ??
    semantic.matchedLow[0] ??
    'contexto neutro'

  let reason = intent.urgencyReason

  if (intent.category === 'execucao' && score >= 75)
  {
    reason = `${intent.urgencyReason} Score elevado por termo [${termLabel}].`
  }
  else if (intent.category === 'alinhamento')
  {
    reason = intent.urgencyReason
  }

  if (!intent.ignoreDeadline && deadlineFactor >= 90)
  {
    reason += ' Prazo crítico reforça a posição no topo.'
  }

  return {
    score,
    reason,
    intent,
    log: {
      influenceWeight,
      influenceLabel: senderLabel,
      semanticScore: semantic.score,
      semanticTerms: [...semantic.matchedHigh, ...semantic.matchedLow],
      deadlineFactor,
      components: {
        influence: Math.round(influencePts),
        semantic: Math.round(semanticPts),
        deadline: Math.round(deadlinePts),
      },
    },
  }
}
