import type { Category, ContaFixa, RecurringIncome, Transaction } from '../store/storeTypes'
import { transactionDayKey } from './financeLedger'

const MONTH_SHORT = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
]

export interface SpreadsheetPeriodSummary
{
  saldoInicio: number
  saldoFinal: number
  receitas: number
  despesas: number
}

export interface SpreadsheetIncomeBreakdown
{
  receitasFixas: number
  receitasExtras: number
  totalReceitas: number
  metaFixa: number
}

export interface SpreadsheetLedgerRow
{
  transaction: Transaction
  categoriaNome: string
  signed: number
  acumulado: number
}

export interface MonthlyBarPoint
{
  mes: string
  receita: number
  despesa: number
}

export interface CumulativePoint
{
  idx: number
  label: string
  acumulado: number
}

export interface AnnualKpi
{
  real: number
  meta: number
  percentual: number
}

function signedValue(t: Transaction): number
{
  if (t.tipo === 'receita') return t.valor
  return -t.valor
}

function resolveCategoryName(t: Transaction, categories: Category[]): string
{
  if (t.categoria_id)
  {
    return categories.find((c) => c.id === t.categoria_id)?.nome ?? t.categoria
  }
  return t.categoria || '-'
}

export function computeSpreadsheetOpening(
  allTransactions: Transaction[],
  periodStart: string,
  saldoInicial: number,
): number
{
  let balance = saldoInicial

  const prior = [...allTransactions]
    .filter((t) => transactionDayKey(t.data) < periodStart)
    .sort((a, b) =>
    {
      const cmp = transactionDayKey(a.data).localeCompare(transactionDayKey(b.data))
      return cmp !== 0 ? cmp : a.id - b.id
    })

  for (const t of prior)
  {
    balance += signedValue(t)
  }

  return balance
}

export function summarizeSpreadsheetPeriod(
  periodTransactions: Transaction[],
  periodStart: string,
  allTransactions: Transaction[],
  saldoInicial: number,
): SpreadsheetPeriodSummary
{
  const saldoInicio = computeSpreadsheetOpening(allTransactions, periodStart, saldoInicial)

  let receitas = 0
  let despesas = 0
  let net = 0

  for (const t of periodTransactions)
  {
    if (t.tipo === 'receita')
    {
      receitas += t.valor
      net += t.valor
    }
    else
    {
      despesas += t.valor
      net -= t.valor
    }
  }

  return {
    saldoInicio,
    saldoFinal: saldoInicio + net,
    receitas,
    despesas,
  }
}

const EXTRA_INCOME_MARKERS = ['[extra:', '[receita-recorrente:']

function isExtraIncomeTransaction(t: Transaction): boolean
{
  if (t.tipo !== 'receita') return false
  const desc = t.descricao.toLowerCase()
  if (EXTRA_INCOME_MARKERS.some((m) => desc.includes(m))) return false
  if (desc.includes('hora extra') || desc.includes('horas extra')) return true
  if (desc.includes('freelance') || desc.includes('bônus') || desc.includes('bonus')) return true
  return desc.includes('[extra:')
}

/** Separa receitas fixas (recorrentes postadas) vs extras no período */
export function buildPeriodIncomeBreakdown(
  periodTransactions: Transaction[],
  recurringIncomes: RecurringIncome[],
): SpreadsheetIncomeBreakdown
{
  const receitaTx = periodTransactions.filter((t) => t.tipo === 'receita')
  const receitasExtras = receitaTx
    .filter(isExtraIncomeTransaction)
    .reduce((s, t) => s + t.valor, 0)
  const receitasFixas = receitaTx
    .filter((t) => !isExtraIncomeTransaction(t))
    .reduce((s, t) => s + t.valor, 0)
  const metaFixa = recurringIncomes
    .filter((r) => r.ativa)
    .reduce((s, r) => s + r.valor, 0)

  return {
    receitasFixas,
    receitasExtras,
    totalReceitas: receitasFixas + receitasExtras,
    metaFixa,
  }
}

/** Extrato com coluna acumulado - estilo planilha pessoal */
export function buildSpreadsheetLedger(
  periodTransactions: Transaction[],
  categories: Category[],
  openingBalance: number,
): SpreadsheetLedgerRow[]
{
  const sorted = [...periodTransactions].sort((a, b) =>
  {
    const cmp = transactionDayKey(a.data).localeCompare(transactionDayKey(b.data))
    return cmp !== 0 ? cmp : a.id - b.id
  })

  let acumulado = openingBalance

  return sorted.map((t) =>
  {
    const signed = signedValue(t)
    acumulado += signed

    return {
      transaction: t,
      categoriaNome: resolveCategoryName(t, categories),
      signed,
      acumulado,
    }
  })
}

export function filterYearTransactions(
  transactions: Transaction[],
  year: number,
): Transaction[]
{
  return transactions.filter((t) =>
  {
    const d = new Date(`${transactionDayKey(t.data)}T12:00:00`)
    return d.getFullYear() === year
  })
}

export function buildMonthlyReceitaDespesa(
  transactions: Transaction[],
  year: number,
): MonthlyBarPoint[]
{
  const yearTx = filterYearTransactions(transactions, year)
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    mes: MONTH_SHORT[i],
    receita: 0,
    despesa: 0,
  }))

  for (const t of yearTx)
  {
    const m = new Date(`${transactionDayKey(t.data)}T12:00:00`).getMonth()
    if (t.tipo === 'receita') byMonth[m].receita += t.valor
    else byMonth[m].despesa += t.valor
  }

  return byMonth
}

export function buildAnnualCumulative(
  transactions: Transaction[],
  year: number,
): CumulativePoint[]
{
  const yearTx = filterYearTransactions(transactions, year)
    .sort((a, b) => transactionDayKey(a.data).localeCompare(transactionDayKey(b.data)))

  let acc = 0
  return yearTx.map((t, i) =>
  {
    acc += signedValue(t)
    const day = transactionDayKey(t.data).slice(8, 10)
    const month = MONTH_SHORT[new Date(`${transactionDayKey(t.data)}T12:00:00`).getMonth()]
    return {
      idx: i + 1,
      label: `${day}/${month}`,
      acumulado: acc,
    }
  })
}

export function buildAnnualKpis(
  transactions: Transaction[],
  year: number,
  recurringIncomes: RecurringIncome[],
  contasFixas: ContaFixa[],
): { receita: AnnualKpi; despesa: AnnualKpi }
{
  const yearTx = filterYearTransactions(transactions, year)

  const realReceita = yearTx
    .filter((t) => t.tipo === 'receita')
    .reduce((s, t) => s + t.valor, 0)

  const realDespesa = yearTx
    .filter((t) => t.tipo !== 'receita')
    .reduce((s, t) => s + t.valor, 0)

  const metaReceita = recurringIncomes
    .filter((r) => r.ativa)
    .reduce((s, r) => s + r.valor, 0) * 12

  const metaDespesa = contasFixas
    .filter((c) => c.ativa)
    .reduce((s, c) => s + c.valor, 0) * 12

  const pct = (real: number, meta: number) =>
    meta > 0 ? (real / meta) * 100 : (real > 0 ? 100 : 0)

  return {
    receita: {
      real: realReceita,
      meta: metaReceita > 0 ? metaReceita : realReceita,
      percentual: pct(realReceita, metaReceita > 0 ? metaReceita : realReceita),
    },
    despesa: {
      real: realDespesa,
      meta: metaDespesa > 0 ? metaDespesa : realDespesa,
      percentual: pct(realDespesa, metaDespesa > 0 ? metaDespesa : realDespesa),
    },
  }
}
