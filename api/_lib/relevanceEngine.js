// Motor de Relevância AXEL — influência + semântica + prazo

import {
  DEFAULT_INFLUENCE_MAP,
  formatSenderLabel,
  resolveInfluenceWeight,
} from './influenceMap.js';
import { analyzeTaskIntent } from './intentAnalyzer.js';

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
];

const LOW_PRIORITY_TERMS = [
  { term: 'sugestão', label: 'Sugestão' },
  { term: 'sugestao', label: 'Sugestão' },
  { term: 'consulta', label: 'Consulta' },
  { term: 'falar', label: 'Conversa' },
  { term: 'ideia', label: 'Ideia' },
  { term: 'quando puder', label: 'Baixa pressa' },
  { term: 'fyi', label: 'Informativo' },
];

/**
 * Análise semântica básica do título (0–100).
 * @param {string} title
 */
export function analyzeTitle(title)
{
  const text = String(title || '').toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '');

  let score = 45;
  const matchedHigh = [];
  const matchedLow = [];

  for (const { term, label } of HIGH_PRIORITY_TERMS)
  {
    if (text.includes(term))
    {
      matchedHigh.push(label);
      score = Math.max(score, 85);
    }
  }

  for (const { term, label } of LOW_PRIORITY_TERMS)
  {
    if (text.includes(term))
    {
      matchedLow.push(label);
      score = Math.min(score, 35);
    }
  }

  if (matchedHigh.length > 1)
  {
    score = Math.min(100, score + matchedHigh.length * 5);
  }

  if (matchedHigh.length === 0 && matchedLow.length > 0)
  {
    score = Math.max(15, 28 - matchedLow.length * 4);
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    matchedHigh,
    matchedLow,
  };
}

/**
 * Fator de prazo 0–100.
 * @param {string | null | undefined} dueIso
 */
export function computeDeadlineFactor(dueIso)
{
  if (!dueIso)
  {
    return 25;
  }

  const hours = (new Date(dueIso).getTime() - Date.now()) / 3_600_000;

  if (hours < 0) return 100;
  if (hours < 4) return 95;
  if (hours < 24) return 82;
  if (hours < 72) return 58;
  if (hours < 168) return 38;
  return 18;
}

/**
 * @typedef {Object} RelevanceUrgencyResult
 * @property {number} score
 * @property {string} reason
 * @property {Object} log
 */

/**
 * Motor de score dinâmico com log explicativo.
 * @param {{ titulo?: string, title?: string, data_vencimento?: string | null, remetente?: string | null }} task
 * @param {string} sender
 * @param {{ influenceMap?: Record<string, number> }} [options]
 * @returns {RelevanceUrgencyResult}
 */
export function calculateUrgency(task, sender, options = {})
{
  const map = options.influenceMap ?? DEFAULT_INFLUENCE_MAP;
  const title = task.titulo ?? task.title ?? '';
  const remetente = sender || task.remetente || task.origem || '';

  const influenceWeight = resolveInfluenceWeight(remetente, map);
  const semantic = analyzeTitle(title);
  const semanticNorm = semantic.score / 100;
  const deadlineFactor = computeDeadlineFactor(task.data_vencimento);

  const influencePts = influenceWeight * 40;
  const semanticPts = semanticNorm * 40;
  const deadlinePts = (deadlineFactor / 100) * 20;

  let score = Math.min(100, Math.max(0, Math.round(influencePts + semanticPts + deadlinePts)));

  const intent = analyzeTaskIntent(task, remetente);
  if (intent.forceMinScore != null)
  {
    score = Math.max(score, intent.forceMinScore);
  }

  const senderLabel = formatSenderLabel(remetente);
  const termLabel =
    semantic.matchedHigh[0] ??
    semantic.matchedLow[0] ??
    'contexto neutro';

  let reason = `Prioridade moderada — origem [${senderLabel}] com contexto [${termLabel}].`;

  if (score >= 75)
  {
    reason = `Prioridade alta devido a e-mail de [${senderLabel}] contendo termo de [${termLabel}].`;
  }
  else if (score < 40)
  {
    reason = `Prioridade baixa — remetente [${senderLabel}] e linguagem de [${termLabel}] sugerem triagem posterior.`;
  }

  if (deadlineFactor >= 90 && !reason.includes('prazo'))
  {
    reason += ' Prazo crítico reforça a posição no topo.';
  }

  return {
    score,
    reason: intent.forceMinScore != null ? intent.urgencyReason : reason,
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
  };
}
