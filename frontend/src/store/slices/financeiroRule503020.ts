import type { FinanceiroSlice } from './financeiroSlice'
import {
  computeRule503020,
  filterTransactionsForMonth,
  getCurrentMonthKey,
} from '../../utils/rule503020'

export async function evaluateRule503020Compliance(
  get: () => FinanceiroSlice,
): Promise<void>
{
  const state = get()
  const monthKey = getCurrentMonthKey()
  const flagKey = `jarvis_503020_quest_${monthKey}`

  try
  {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(flagKey) === '1')
    {
      return
    }
  }
  catch { /* SSR */ }

  const monthTx = filterTransactionsForMonth(state.transactions)
  const receita = monthTx
    .filter((t) => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0)
  const despesas = monthTx
    .filter((t) => t.tipo === 'despesa')
    .reduce((sum, t) => sum + t.valor, 0)

  const rule = computeRule503020({
    receita,
    despesas,
    monthTx,
    activeCategories: state.categories,
  })

  if (!rule.isCompliant) return

  try
  {
    sessionStorage.setItem(flagKey, '1')
  }
  catch { /* private mode */ }

  const store = get() as FinanceiroSlice & {
    incrementQuestProgress?: (t: string, v: number) => Promise<void>
  }

  if (store.incrementQuestProgress)
  {
    await store.incrementQuestProgress('Bater a meta da Regra 50/30/20', 1)
  }

  const { toast } = await import('sonner')
  toast.success('Regra 50-30-20 cumprida este mês!', {
    description: 'Quest semanal de finanças atualizada.',
  })
}
