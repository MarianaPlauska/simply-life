import type { TarefaUnificada } from '../types'

/** Colunas do board temporal legado - partição exclusiva (sem card em duas faixas) */

export function isFazer1h(t: TarefaUnificada): boolean
{
  if (t.status !== 'pendente') return false
  const score = t.score_urgencia ?? 0
  return score >= 60 || t.prioridade === 'critica'
}

export function isFazerHoje(t: TarefaUnificada): boolean
{
  if (isFazer1h(t)) return false
  if (t.status === 'em_progresso') return true
  if (t.status !== 'pendente') return false
  const score = t.score_urgencia ?? 0
  return (score >= 35 && score < 60) || t.prioridade === 'alta'
}

export function isNestaSemana(t: TarefaUnificada): boolean
{
  if (t.status === 'concluida') return false
  if (isFazer1h(t) || isFazerHoje(t)) return false
  return t.status === 'pendente'
}
