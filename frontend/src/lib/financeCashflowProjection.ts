import type { ContaFixa, RecurringIncome, Transaction } from '../store/storeTypes'

export interface CashflowMonthProjection
{
  mes: string
  receita: number
  despesa: number
  saldo: number
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function monthKeyFromDate(d: Date): string
{
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function avgMonthly(
  transactions: Transaction[],
  tipo: 'receita' | 'despesa',
): number
{
  const byMonth = new Map<string, number>()

  for (const t of transactions)
  {
    if (t.tipo !== tipo) continue
    const key = t.data.slice(0, 7)
    byMonth.set(key, (byMonth.get(key) ?? 0) + t.valor)
  }

  if (byMonth.size === 0) return 0
  const total = Array.from(byMonth.values()).reduce((s, v) => s + v, 0)
  return total / byMonth.size
}

/** Projeção — recorrentes + média histórica + saldo atual */
export function buildCashflowProjection(
  transactions: Transaction[],
  recurringIncomes: RecurringIncome[],
  contasFixas: ContaFixa[],
  saldoAtual: number,
  monthsAhead = 6,
  reference = new Date(),
): CashflowMonthProjection[]
{
  const recIncome = recurringIncomes
    .filter((r) => r.ativa)
    .reduce((s, r) => s + r.valor, 0)

  const recExpense = contasFixas
    .filter((c) => c.ativa)
    .reduce((s, c) => s + c.valor, 0)

  const avgIncome = avgMonthly(transactions, 'receita')
  const avgExpense = avgMonthly(transactions, 'despesa')

  const monthlyIncome = recIncome > 0 ? recIncome : (avgIncome > 0 ? avgIncome : 0)
  const monthlyExpense = recExpense > 0 ? recExpense : (avgExpense > 0 ? avgExpense : 0)

  let balance = saldoAtual
  const rows: CashflowMonthProjection[] = []

  for (let i = 1; i <= monthsAhead; i++)
  {
    const target = new Date(reference.getFullYear(), reference.getMonth() + i, 1)
    const label = `${MONTH_NAMES[target.getMonth()]} ${target.getFullYear()}`

    balance += monthlyIncome - monthlyExpense

    rows.push({
      mes: label,
      receita: monthlyIncome,
      despesa: monthlyExpense,
      saldo: balance,
    })
  }

  return rows
}

export function currentMonthSaldo(transactions: Transaction[]): number
{
  const now = new Date()
  const key = monthKeyFromDate(now)

  return transactions
    .filter((t) => t.data.startsWith(key))
    .reduce((s, t) =>
    {
      if (t.tipo === 'receita') return s + t.valor
      if (t.tipo === 'despesa' || t.tipo === 'investimento') return s - t.valor
      return s
    }, 0)
}
