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
      headline: 'Apertado',
      detail: 'Despesas passaram das entradas — priorize o essencial.',
    }
  }

  if (saldoFinal < 500 || spendRatio > 0.95)
  {
    return {
      mood: 'tight',
      headline: 'No limite',
      detail: 'Pouca folga no período — vale revisar gastos discricionários.',
    }
  }

  if (net > 0 && spendRatio < 0.75)
  {
    return {
      mood: 'great',
      headline: 'Em dia',
      detail: 'Entradas cobrem o mês com folga — bom ritmo!',
    }
  }

  return {
    mood: 'ok',
    headline: 'Equilibrado',
    detail: 'Caixa estável — mantenha o registro em dia.',
  }
}
