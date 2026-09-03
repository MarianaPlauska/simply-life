import { monthExpenseTotal, monthIncomeTotal, type FinanceTx } from './finance'

/** Regra 50/30/20 sobre receita do mês */
export function rule503020(txs: FinanceTx[]): {
  income: number
  needs: number
  wants: number
  savings: number
  spent: number
  needsBudget: number
  wantsBudget: number
  savingsBudget: number
}
{
  const income = monthIncomeTotal(txs)
  const spent = monthExpenseTotal(txs)
  const needsBudget = income * 0.5
  const wantsBudget = income * 0.3
  const savingsBudget = income * 0.2
  return {
    income,
    spent,
    needs: spent * 0.55,
    wants: spent * 0.3,
    savings: Math.max(0, income - spent),
    needsBudget,
    wantsBudget,
    savingsBudget,
  }
}

/** Forecast simples: saldo + média diária * dias restantes */
export function cashflowForecast(
  disponivel: number,
  txs: FinanceTx[],
  daysAhead = 14,
): { projected: number; dailyBurn: number; risk: 'ok' | 'attention' | 'danger' }
{
  const spent = monthExpenseTotal(txs)
  const day = new Date().getDate()
  const dailyBurn = day > 0 ? spent / day : 0
  const projected = disponivel - dailyBurn * daysAhead
  const risk =
    projected < 0 ? 'danger' : projected < disponivel * 0.25 ? 'attention' : 'ok'
  return { projected, dailyBurn, risk }
}

export type FinanceCoachTip = {
  id: string
  title: string
  body: string
  tone: 'ok' | 'attention' | 'danger'
}

export function buildFinanceCoachTips(input: {
  disponivel: number
  spent: number
  income: number
  openBills: number
}): FinanceCoachTip[]
{
  const tips: FinanceCoachTip[] = []
  const { disponivel, spent, income, openBills } = input

  if (income > 0 && spent / income > 0.85)
  {
    tips.push({
      id: 'burn',
      title: 'Gasto alto no mês',
      body: 'Você já usou mais de 85% da receita. Vale revisar categorias grandes.',
      tone: 'attention',
    })
  }
  if (disponivel < 500)
  {
    tips.push({
      id: 'cash',
      title: 'Caixa apertado',
      body: 'Saldo disponível baixo. Priorize essenciais e evite cartão.',
      tone: 'danger',
    })
  }
  if (openBills > 0)
  {
    tips.push({
      id: 'bills',
      title: `${openBills} conta(s) em aberto`,
      body: 'Marque o que vence esta semana para não surpreender o caixa.',
      tone: 'attention',
    })
  }
  if (tips.length === 0)
  {
    tips.push({
      id: 'ok',
      title: 'Ritmo saudável',
      body: 'Caixa e gastos estão sob controle. Continue registrando.',
      tone: 'ok',
    })
  }
  return tips
}
