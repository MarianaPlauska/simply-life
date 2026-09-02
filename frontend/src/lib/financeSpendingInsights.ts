import type { Category, Transaction } from '../store/storeTypes'
import { transactionDayKey } from './financeLedger'

export interface SpendingBarItem
{
  id: string
  label: string
  value: number
  color: string
  icone?: string
}

export interface WeekRange
{
  start: string
  end: string
  label: string
}

function fmtDay(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Semana corrente (segunda → domingo) */
export function getCurrentWeekRange(reference = new Date()): WeekRange
{
  const d = new Date(reference)
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const startLabel = monday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const endLabel = sunday.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return {
    start: fmtDay(monday),
    end: fmtDay(sunday),
    label: `${startLabel} – ${endLabel}`,
  }
}

export function filterTransactionsByRange(
  transactions: Transaction[],
  start: string,
  end: string,
): Transaction[]
{
  return transactions.filter((t) =>
  {
    const key = transactionDayKey(t.data)
    return key >= start && key <= end
  })
}

function resolveIcon(t: Transaction, categories: Category[]): string | undefined
{
  if (t.categoria_id)
  {
    return categories.find((c) => c.id === t.categoria_id)?.icone
  }
  return undefined
}

function resolveLabel(t: Transaction, categories: Category[]): string
{
  if (t.categoria_id)
  {
    return categories.find((c) => c.id === t.categoria_id)?.nome ?? t.categoria ?? 'Outros'
  }
  return t.categoria || t.descricao || 'Outros'
}

function resolveColor(t: Transaction, categories: Category[]): string
{
  if (t.categoria_id)
  {
    return categories.find((c) => c.id === t.categoria_id)?.cor ?? '#71717a'
  }
  return '#71717a'
}

/** Maiores gastos da semana agrupados por categoria */
export function topWeeklySpendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  limit = 6,
  reference = new Date(),
): SpendingBarItem[]
{
  const week = getCurrentWeekRange(reference)
  const weekTx = filterTransactionsByRange(transactions, week.start, week.end)
    .filter((t) => t.tipo === 'despesa')

  const map = new Map<string, SpendingBarItem>()

  for (const t of weekTx)
  {
    const key = t.categoria_id ? `cat-${t.categoria_id}` : `raw-${t.categoria || t.descricao}`
    const existing = map.get(key)
    if (existing)
    {
      existing.value += t.valor
    }
    else
    {
      map.set(key, {
        id: key,
        label: resolveLabel(t, categories),
        value: t.valor,
        color: resolveColor(t, categories),
        icone: resolveIcon(t, categories),
      })
    }
  }

  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/** Maiores gastos do mês corrente agrupados por categoria */
export function topMonthlySpendingByCategory(
  transactions: Transaction[],
  categories: Category[],
  limit = 5,
  reference = new Date(),
): SpendingBarItem[]
{
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const start = fmtDay(new Date(y, m, 1))
  const end = fmtDay(new Date(y, m + 1, 0))

  const monthTx = filterTransactionsByRange(transactions, start, end)
    .filter((t) => t.tipo === 'despesa')

  const map = new Map<string, SpendingBarItem>()

  for (const t of monthTx)
  {
    const key = t.categoria_id ? `cat-${t.categoria_id}` : `raw-${t.categoria || t.descricao}`
    const existing = map.get(key)
    if (existing)
    {
      existing.value += t.valor
    }
    else
    {
      map.set(key, {
        id: key,
        label: resolveLabel(t, categories),
        value: t.valor,
        color: resolveColor(t, categories),
        icone: resolveIcon(t, categories),
      })
    }
  }

  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

/** Maiores gastos no cartão (fatura aberta ou semana — usa todas despesas do cartão no período) */
export function topCardSpending(
  transactions: Transaction[],
  cardId: string,
  categories: Category[],
  options?: { start?: string; end?: string; limit?: number },
): SpendingBarItem[]
{
  const limit = options?.limit ?? 6
  let cardTx = transactions.filter(
    (t) => t.tipo === 'despesa' && t.card_id === cardId,
  )

  if (options?.start && options?.end)
  {
    cardTx = filterTransactionsByRange(cardTx, options.start, options.end)
  }

  const map = new Map<string, SpendingBarItem>()

  for (const t of cardTx)
  {
    const key = t.categoria_id ? `cat-${t.categoria_id}` : `desc-${t.descricao}`
    const existing = map.get(key)
    if (existing)
    {
      existing.value += t.valor
    }
    else
    {
      map.set(key, {
        id: key,
        label: resolveLabel(t, categories),
        value: t.valor,
        color: resolveColor(t, categories),
        icone: resolveIcon(t, categories),
      })
    }
  }

  return [...map.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}
