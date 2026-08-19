import type { SpreadsheetPeriodSummary } from './financeSpreadsheetAnalytics'

export type SpreadsheetMood = 'great' | 'ok' | 'tight' | 'stressed'

export interface SpreadsheetMoodState
{
  mood: SpreadsheetMood
  headline: string
  detail: string
}

/** Humor do mascote com base no saldo e no ritmo receita × despesa */
export function resolveSpreadsheetMood(summary: SpreadsheetPeriodSummary): SpreadsheetMoodState
{
  const { saldoFinal, receitas, despesas } = summary
  const net = receitas - despesas
  const spendRatio = receitas > 0 ? despesas / receitas : despesas > 0 ? 2 : 0

  if (saldoFinal < 0 || (receitas > 0 && spendRatio > 1.15))
  {
    return {
      mood: 'stressed',
      headline: 'Folga negativa',
      detail: 'Saídas passaram das entradas. Priorize contas e corte o discricionário.',
    }
  }

  if (saldoFinal < 500 || spendRatio > 0.95)
  {
    return {
      mood: 'tight',
      headline: 'Folga estreita',
      detail: 'Pouca margem no período. Revise gastos que podem esperar.',
    }
  }

  if (net > 0 && spendRatio < 0.75)
  {
    return {
      mood: 'great',
      headline: 'Folga positiva',
      detail: 'Entradas cobrem o mês com margem. Mantenha o ritmo de registro.',
    }
  }

  return {
    mood: 'ok',
    headline: 'Caixa estável',
    detail: 'Saldo em equilíbrio. Continue lançando para o AXEL ter base.',
  }
}
