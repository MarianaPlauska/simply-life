// Motor de score compartilhado - ingest-tasks e webhook-ingest

import { resolveInfluenceWeight, DEFAULT_INFLUENCE_MAP } from './influenceMap.js';

export const ORIGIN_WEIGHTS = {
  meeting: 50,
  google_cal: 50,
  github_issue: 30,
  github_pr: 35,
  gmail: 15,
  email: 15,
  webhook: 20,
  manual: 10,
};

const URGENCY_KEYWORDS = [
  'urgente', 'urgent', 'asap', 'bloqueado', 'blocked', 'impedimento',
  'deadline', 'critical', 'critico', 'crítico', 'produção', 'production',
  'hotfix', 'p0', 'p1', 'downtime', 'fora do ar',
];

const NOISE_KEYWORDS = [
  'newsletter', 'unsubscribe', 'descadastrar', 'marketing',
  'promoção', 'promo', 'spam', 'noreply', 'no-reply',
];

export function calcBaseScore(origem)
{
  return ORIGIN_WEIGHTS[origem] || ORIGIN_WEIGHTS.manual;
}

export function calcContextModifiers(aiFlags, rawText, keywordBoost = 0)
{
  let mod = 0;
  const textLower = (rawText || '').toLowerCase();

  if (aiFlags?.is_urgent) mod += 30;
  if (aiFlags?.is_vip) mod += 25;
  if (aiFlags?.is_bug) mod += 20;
  if (keywordBoost > 0) mod += keywordBoost;

  const hasUrgency = URGENCY_KEYWORDS.some((kw) => textLower.includes(kw));
  if (hasUrgency && !aiFlags?.is_urgent) mod += 15;

  const isNoise = NOISE_KEYWORDS.some((kw) => textLower.includes(kw));
  if (isNoise) mod -= 40;
  if (aiFlags?.is_noise) mod -= 30;

  return mod;
}

export function calcTemporalFactor(createdAtISO)
{
  if (!createdAtISO) return 0;
  const diffMs = Date.now() - new Date(createdAtISO).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  return Math.min(diffDays * 2, 20);
}

export function clampScore(score)
{
  return Math.max(0, Math.min(100, score));
}

const HOJE_FLOOR = 92;
const KEY_SENDER_WEIGHT = 0.85;

export function shouldForceHoje(aiFlags, rawText, sender)
{
  if (aiFlags?.is_urgent || aiFlags?.is_vip) return true;
  const textLower = (rawText || '').toLowerCase();
  if (URGENCY_KEYWORDS.some((kw) => textLower.includes(kw))) return true;
  return resolveInfluenceWeight(sender || '', DEFAULT_INFLUENCE_MAP) >= KEY_SENDER_WEIGHT;
}

/** Piso de Hoje após a IA ler o e-mail - urgente/VIP não ficam na Semana */
export function applyHojeFloor(score, aiFlags, rawText, sender)
{
  if (shouldForceHoje(aiFlags, rawText, sender))
  {
    return Math.max(score, HOJE_FLOOR);
  }
  return score;
}

export function mapScoreToPrioridade(score)
{
  if (score >= 80) return 'critica';
  if (score >= 55) return 'alta';
  if (score >= 30) return 'media';
  return 'baixa';
}

export function scoreFromItem(item, aiResult = {}, keywordBoost = 0)
{
  const { subject, body, sender, origem, created_at } = item;
  const rawText = `${sender || ''} ${subject || ''} ${body || ''}`;
  const itemOrigem = origem || 'webhook';
  const baseScore = calcBaseScore(itemOrigem);
  const contextMod = calcContextModifiers(aiResult, rawText, keywordBoost);
  const temporalMod = calcTemporalFactor(created_at);
  let finalScore = clampScore(baseScore + contextMod + temporalMod);
  finalScore = applyHojeFloor(finalScore, aiResult, rawText, sender);
  const prioridade = mapScoreToPrioridade(finalScore);

  return {
    finalScore,
    prioridade,
    breakdown: { base: baseScore, context: contextMod, temporal: temporalMod, origem: itemOrigem },
    titulo: aiResult.titulo || subject || '(sem título)',
    snippet: (aiResult.snippet || body || subject || '').substring(0, 100),
    itemOrigem,
  };
}
