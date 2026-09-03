import { formatSenderLabel, resolveInfluenceWeight } from './influenceMap'
import { DEFAULT_INFLUENCE_MAP } from './influenceMap'
import { HOJE_SCORE_FLOOR } from './temporalHorizon'
import type { TarefaUnificada } from '../types'

// IntentAnalyzer - classifica intenção a partir do texto e metadados do e-mail

export type TaskIntentCategory = 'bloqueio' | 'alinhamento' | 'execucao'

export interface IntentAnalysis
{
  category: TaskIntentCategory
  categoryLabel: string
  urgencyReason: string
  forceMinScore: number | null
  ignoreDeadline: boolean
  flowAlert: string | null
  matchedSignals: string[]
}

const BLOQUEIO_TERMS = [
  { term: 'bloqueio', signal: 'impedimento' },
  { term: 'bloqueado', signal: 'impedimento' },
  { term: 'impedimento', signal: 'impedimento' },
  { term: 'impedido', signal: 'impedimento' },
  { term: 'travado', signal: 'fluxo travado' },
  { term: 'travando', signal: 'fluxo travado' },
  { term: 'parado', signal: 'execução parada' },
  { term: 'blocking', signal: 'impedimento' },
  { term: 'blocked', signal: 'impedimento' },
  { term: 'aguardando', signal: 'dependência externa' },
  { term: 'nao consigo', signal: 'bloqueio operacional' },
  { term: 'não consigo', signal: 'bloqueio operacional' },
  { term: 'depende de', signal: 'dependência crítica' },
  { term: 'sem acesso', signal: 'bloqueio de acesso' },
] as const

const ALINHAMENTO_TERMS = [
  { term: 'alinhamento', signal: 'alinhamento' },
  { term: 'fyi', signal: 'informativo' },
  { term: 'para conhecimento', signal: 'informativo' },
  { term: 'consulta', signal: 'consulta' },
  { term: 'quando puder', signal: 'baixa pressa' },
  { term: 'sugestao', signal: 'sugestão' },
  { term: 'sugestão', signal: 'sugestão' },
  { term: 'informacao', signal: 'informação' },
  { term: 'informação', signal: 'informação' },
  { term: 'status', signal: 'atualização' },
  { term: 'update', signal: 'atualização' },
  { term: 'falar sobre', signal: 'conversa' },
] as const

const EXECUCAO_TERMS = [
  { term: 'implementar', signal: 'entrega técnica' },
  { term: 'corrigir', signal: 'correção' },
  { term: 'criar', signal: 'criação' },
  { term: 'entregar', signal: 'entrega' },
  { term: 'deploy', signal: 'publicação' },
  { term: 'refatorar', signal: 'refatoração' },
  { term: 'concluir', signal: 'fechamento' },
] as const

const URGENTE_TERMS = [
  { term: 'urgente', signal: 'urgência no título' },
  { term: 'urgent', signal: 'urgência no título' },
  { term: 'asap', signal: 'prazo imediato' },
  { term: 'p0', signal: 'prioridade P0' },
  { term: 'p1', signal: 'prioridade P1' },
  { term: 'hotfix', signal: 'hotfix' },
  { term: 'imediato', signal: 'ação imediata' },
] as const

const KEY_SENDER_WEIGHT = 0.85
const BLOQUEIO_MIN_SCORE = HOJE_SCORE_FLOOR
const URGENTE_MIN_SCORE = HOJE_SCORE_FLOOR

function normalizeText(...parts: Array<string | null | undefined>): string
{
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function matchTerms(
  text: string,
  catalog: readonly { term: string; signal: string }[],
): string[]
{
  const hits: string[] = []
  for (const { term, signal } of catalog)
  {
    if (text.includes(term))
    {
      hits.push(signal)
    }
  }
  return hits
}

function buildUrgencyReason(
  category: TaskIntentCategory,
  senderLabel: string,
  isKeySender: boolean,
  signals: string[],
): string
{
  const detail = signals[0] ?? 'contexto analisado'
  const senderPart = isKeySender ? 'remetente chave' : `remetente [${senderLabel}]`

  switch (category)
  {
    case 'bloqueio':
      return `Classificado como Bloqueio: ${senderPart} menciona ${detail}.`
    case 'alinhamento':
      return `Classificado como Alinhamento: ${senderPart} compartilha ${detail} - prazo secundário.`
    case 'execucao':
      return `Classificado como Execução: ${senderPart} - ${detail}, tarefa acionável.`
  }
}

function buildUrgenteReason(
  senderLabel: string,
  isKeySender: boolean,
  signals: string[],
): string
{
  const detail = signals[0] ?? 'sinal de urgência'
  const senderPart = isKeySender ? 'remetente chave' : `remetente [${senderLabel}]`
  return `Promovido a Hoje: ${senderPart} · ${detail}.`
}

/** Analisa título, descrição, notas e metadados do remetente */
export function analyzeTaskIntent(
  task: TarefaUnificada,
  senderOverride?: string,
): IntentAnalysis
{
  const remetente = senderOverride ?? task.remetente ?? task.origem ?? ''
  const senderLabel = formatSenderLabel(remetente)
  const influenceWeight = resolveInfluenceWeight(remetente, DEFAULT_INFLUENCE_MAP)
  const isKeySender = influenceWeight >= KEY_SENDER_WEIGHT

  const text = normalizeText(
    task.titulo,
    task.descricao,
    task.notas_locais,
    task.snippet_100_char,
  )

  const bloqueioHits = matchTerms(text, BLOQUEIO_TERMS)
  const urgenteHits = matchTerms(text, URGENTE_TERMS)
  const alinhamentoHits = matchTerms(text, ALINHAMENTO_TERMS)
  const execucaoHits = matchTerms(text, EXECUCAO_TERMS)

  if (bloqueioHits.length > 0 || (isKeySender && text.includes('erro')))
  {
    const signals = bloqueioHits.length > 0
      ? bloqueioHits
      : ['impedimento crítico']

    return {
      category: 'bloqueio',
      categoryLabel: 'Bloqueio',
      urgencyReason: buildUrgencyReason('bloqueio', senderLabel, isKeySender, signals),
      forceMinScore: BLOQUEIO_MIN_SCORE,
      ignoreDeadline: true,
      flowAlert: 'Esta tarefa está travando o fluxo',
      matchedSignals: signals,
    }
  }

  if (urgenteHits.length > 0 || isKeySender)
  {
    const signals = urgenteHits.length > 0
      ? urgenteHits
      : ['remetente importante']

    return {
      category: 'execucao',
      categoryLabel: 'Execução',
      urgencyReason: buildUrgenteReason(senderLabel, isKeySender, signals),
      forceMinScore: URGENTE_MIN_SCORE,
      ignoreDeadline: false,
      flowAlert: null,
      matchedSignals: signals,
    }
  }

  if (alinhamentoHits.length > 0 && execucaoHits.length === 0)
  {
    return {
      category: 'alinhamento',
      categoryLabel: 'Alinhamento',
      urgencyReason: buildUrgencyReason(
        'alinhamento',
        senderLabel,
        isKeySender,
        alinhamentoHits,
      ),
      forceMinScore: null,
      ignoreDeadline: false,
      flowAlert: null,
      matchedSignals: alinhamentoHits,
    }
  }

  const execSignals = execucaoHits.length > 0 ? execucaoHits : ['ação direta']

  return {
    category: 'execucao',
    categoryLabel: 'Execução',
    urgencyReason: buildUrgencyReason('execucao', senderLabel, isKeySender, execSignals),
    forceMinScore: null,
    ignoreDeadline: false,
    flowAlert: null,
    matchedSignals: execSignals,
  }
}

export const INTENT_CATEGORY_STYLES: Record<
  TaskIntentCategory,
  { border: string; text: string; badge: string }
> = {
  bloqueio: {
    border: 'border-urgente/35',
    text: 'text-urgente',
    badge: 'bg-urgente/10 text-urgente border-urgente/30',
  },
  alinhamento: {
    border: 'border-line',
    text: 'text-ink-muted',
    badge: 'bg-chrome/40 text-ink-muted border-line',
  },
  execucao: {
    border: 'border-accent/30',
    text: 'text-accent',
    badge: 'bg-accent-muted/40 text-accent border-accent/25',
  },
}
