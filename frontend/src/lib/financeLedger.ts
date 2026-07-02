import type { Category, Transaction } from '../store/storeTypes'
import { dedupeTransactionsForLedger } from './financeTransactionDedup'

// Razão contábil — saldo corrente vs projetado (pago / pendente / agendado)

export interface LedgerRow
{
  transaction: Transaction
  categoriaNome: string
  delta: number
  saldoApos: number
  afetaSaldo: boolean
}

export interface LedgerSummary
{
  saldoCorrente: number
  saldoProjetado: number
  receitasPagas: number
  despesasPagas: number
  pendentes: number
  agendados: number
}

/** Caixa — compras no cartão não debitam até pagamento da fatura */
export function affectsCashBalance(t: Transaction): boolean
{
  const status = t.status_pagamento ?? 'pendente'
  if (status !== 'pago') return false
  if (t.card_id && t.tipo === 'despesa') return false
  return true
}

function affectsBalance(t: Transaction): boolean
{
  return affectsCashBalance(t)
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
  return t.categoria || '—'
}

/** Extrai YYYY-MM-DD local a partir do campo data da transação */
export function transactionDayKey(data: string): string
{
  return data.slice(0, 10)
}

export function isToday(data: string): boolean
{
  const today = new Date().toISOString().slice(0, 10)
  return transactionDayKey(data) === today
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  year: number,
  month: number,
): Transaction[]
{
  return transactions.filter((t) =>
  {
    const d = new Date(`${transactionDayKey(t.data)}T12:00:00`)
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export function filterTransactionsByDay(transactions: Transaction[], dayKey: string): Transaction[]
{
  return transactions.filter((t) => transactionDayKey(t.data) === dayKey)
}

/** Saldo acumulado cronológico — estilo extrato bancário */
export function buildRunningLedger(
  transactions: Transaction[],
  categories: Category[],
  options?: { initialBalance?: number },
): LedgerRow[]
{
  const initial = options?.initialBalance ?? 0
  const sorted = [...transactions].sort((a, b) =>
  {
    const cmp = transactionDayKey(a.data).localeCompare(transactionDayKey(b.data))
    if (cmp !== 0) return cmp
    return a.id - b.id
  })

  let balance = initial
  return sorted.map((t) =>
  {
    const afeta = affectsBalance(t)
    const delta = afeta ? signedValue(t) : 0
    balance += delta
    return {
      transaction: t,
      categoriaNome: resolveCategoryName(t, categories),
      delta,
      saldoApos: balance,
      afetaSaldo: afeta,
    }
  })
}

/** Resumo — saldo inicial + movimentações que afetam caixa (sem duplicatas de boleto) */
export function summarizeLedger(transactions: Transaction[], initialBalance = 0): LedgerSummary
{
  const unique = dedupeTransactionsForLedger(transactions)
  let saldoCorrente = initialBalance
  let receitasPagas = 0
  let despesasPagas = 0
  let pendentes = 0
  let agendados = 0
  let saldoProjetado = initialBalance

  for (const t of unique)
  {
    const status = t.status_pagamento ?? 'pendente'
    const signed = signedValue(t)
    const isCashExpense = t.tipo !== 'receita' && !t.card_id

    if (status === 'pago' && affectsCashBalance(t))
    {
      saldoCorrente += signed
      saldoProjetado += signed
      if (t.tipo === 'receita') receitasPagas += t.valor
      else despesasPagas += t.valor
    }
    else if (status === 'pendente' && isCashExpense)
    {
      pendentes += t.valor
      saldoProjetado += signed
    }
    else if (status === 'agendado' && t.tipo !== 'receita')
    {
      // Futuro no cartão ou no caixa — compromete o projetado
      agendados += t.valor
      saldoProjetado += signed
    }
  }

  return {
    saldoCorrente,
    saldoProjetado,
    receitasPagas,
    despesasPagas,
    pendentes,
    agendados,
  }
}

export interface DailyRollup
{
  day: string
  receita: number
  despesa: number
  liquido: number
  count: number
}

export function rollupByDay(transactions: Transaction[]): DailyRollup[]
{
  const map = new Map<string, DailyRollup>()

  for (const t of transactions)
  {
    if (!affectsBalance(t)) continue
    const day = transactionDayKey(t.data)
    const row = map.get(day) ?? { day, receita: 0, despesa: 0, liquido: 0, count: 0 }
    if (t.tipo === 'receita')
    {
      row.receita += t.valor
      row.liquido += t.valor
    }
    else
    {
      row.despesa += t.valor
      row.liquido -= t.valor
    }
    row.count += 1
    map.set(day, row)
  }

  return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day))
}
