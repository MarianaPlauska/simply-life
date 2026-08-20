// Motor de score local para tarefas criadas manualmente
// Espelha as palavras-chave do api/_lib/triageScore.js para classificar imediatamente

const URGENCY_KEYWORDS = [
  'urgente', 'urgent', 'asap', 'bloqueado', 'blocked', 'impedimento',
  'deadline', 'critical', 'critico', 'crítico', 'producao', 'produção', 'production',
  'hotfix', 'p0', 'p1', 'downtime', 'fora do ar', 'agora', 'imediato',
]

const ALTA_KEYWORDS = [
  'importante', 'reuniao', 'reunião', 'meeting', 'cliente',
  'vencimento', 'pagar', 'entrega', 'hoje',
]

const NOISE_KEYWORDS = [
  'newsletter', 'unsubscribe', 'descadastrar', 'marketing', 'promoção', 'promo',
]

export interface LocalScoreResult
{
  score: number
  prioridade: 'critica' | 'alta' | 'media' | 'baixa'
}

/** Calcula score e prioridade a partir do texto local (sem IA) */
export function localScoreFromText(text: string, basePrio?: string): LocalScoreResult
{
  const t = (text || '').toLowerCase()

  if (URGENCY_KEYWORDS.some((kw) => t.includes(kw)))
  {
    return { score: 92, prioridade: 'critica' }
  }

  if (ALTA_KEYWORDS.some((kw) => t.includes(kw)))
  {
    return { score: 65, prioridade: 'alta' }
  }

  if (NOISE_KEYWORDS.some((kw) => t.includes(kw)))
  {
    return { score: 10, prioridade: 'baixa' }
  }

  // tarefa neutra entra como "Nesta Semana" mas com score visível
  const fallback = basePrio === 'critica' ? 92
    : basePrio === 'alta' ? 65
      : basePrio === 'baixa' ? 20
        : 35

  const prioridade: LocalScoreResult['prioridade'] =
    fallback >= 80 ? 'critica'
      : fallback >= 60 ? 'alta'
        : fallback >= 30 ? 'media'
          : 'baixa'

  return { score: fallback, prioridade }
}
