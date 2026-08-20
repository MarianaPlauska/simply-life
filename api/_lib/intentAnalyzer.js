// IntentAnalyzer — classificação de intenção (espelho do frontend)

import { formatSenderLabel, resolveInfluenceWeight, DEFAULT_INFLUENCE_MAP } from './influenceMap.js';

const BLOQUEIO_TERMS = [
  'bloqueio', 'bloqueado', 'impedimento', 'travado', 'travando', 'parado',
  'blocking', 'blocked', 'aguardando', 'depende de',
];

const ALINHAMENTO_TERMS = [
  'alinhamento', 'fyi', 'para conhecimento', 'consulta', 'quando puder',
  'sugestao', 'sugestão', 'informacao', 'informação', 'status', 'update',
];

const URGENTE_TERMS = ['urgente', 'urgent', 'asap', 'p0', 'p1', 'hotfix', 'imediato'];

const KEY_SENDER_WEIGHT = 0.85;
const HOJE_MIN_SCORE = 92;

function normalizeText(...parts)
{
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * @param {{ titulo?: string, title?: string, descricao?: string, content?: string, remetente?: string, origem?: string }} task
 * @param {string} [senderOverride]
 */
export function analyzeTaskIntent(task, senderOverride)
{
  const remetente = senderOverride || task.remetente || task.origem || '';
  const senderLabel = formatSenderLabel(remetente);
  const isKeySender = resolveInfluenceWeight(remetente, DEFAULT_INFLUENCE_MAP) >= KEY_SENDER_WEIGHT;

  const text = normalizeText(
    task.titulo || task.title,
    task.descricao || task.content,
    task.notas_locais,
  );

  const hasBloqueio = BLOQUEIO_TERMS.some((t) => text.includes(t));
  const hasUrgente = URGENTE_TERMS.some((t) => text.includes(t));
  const hasAlinhamento = ALINHAMENTO_TERMS.some((t) => text.includes(t));

  if (hasBloqueio || (isKeySender && text.includes('erro')))
  {
    const detail = hasBloqueio ? 'impedimento' : 'impedimento crítico';
    const senderPart = isKeySender ? 'remetente chave' : `remetente [${senderLabel}]`;
    return {
      category: 'bloqueio',
      categoryLabel: 'Bloqueio',
      urgencyReason: `Classificado como Bloqueio: ${senderPart} menciona ${detail}.`,
      forceMinScore: HOJE_MIN_SCORE,
      ignoreDeadline: true,
      flowAlert: 'Esta tarefa está travando o fluxo',
    };
  }

  if (hasUrgente || isKeySender)
  {
    const detail = hasUrgente ? 'urgência no título' : 'remetente importante';
    const senderPart = isKeySender ? 'remetente chave' : `remetente [${senderLabel}]`;
    return {
      category: 'execucao',
      categoryLabel: 'Execução',
      urgencyReason: `Promovido a Hoje: ${senderPart} · ${detail}.`,
      forceMinScore: HOJE_MIN_SCORE,
      ignoreDeadline: false,
      flowAlert: null,
    };
  }

  if (hasAlinhamento)
  {
    const senderPart = isKeySender ? 'remetente chave' : `remetente [${senderLabel}]`;
    return {
      category: 'alinhamento',
      categoryLabel: 'Alinhamento',
      urgencyReason: `Classificado como Alinhamento: ${senderPart} compartilha informação — prazo secundário.`,
      forceMinScore: null,
      ignoreDeadline: false,
      flowAlert: null,
    };
  }

  const senderPart = isKeySender ? 'remetente chave' : `remetente [${senderLabel}]`;
  return {
    category: 'execucao',
    categoryLabel: 'Execução',
    urgencyReason: `Classificado como Execução: ${senderPart} — tarefa acionável.`,
    forceMinScore: null,
    ignoreDeadline: false,
    flowAlert: null,
  };
}
