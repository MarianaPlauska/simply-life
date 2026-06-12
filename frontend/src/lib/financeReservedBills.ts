import type { ReservedBill, Transaction } from '../store/storeTypes'
import { summarizeLedger, type LedgerSummary } from './financeLedger'

export interface ReservationSummary
{
  totalAlocado: number
  totalGasto: number
  totalReservado: number
  countAbertas: number
}

export interface CashPosition extends LedgerSummary
{
  saldoInicial: number
  saldoDisponivel: number
  saldoProjetadoDisponivel: number
  reservaRestante: number
}

export function summarizeReservations(bills: ReservedBill[]): ReservationSummary
{
  const abertas = bills.filter((b) => b.status === 'aberta')
  let totalAlocado = 0
  let totalGasto = 0
  let totalReservado = 0

  for (const b of abertas)
  {
    totalAlocado += b.valor_alocado
    totalGasto += b.valor_gasto
    totalReservado += Math.max(0, b.valor_alocado - b.valor_gasto)
  }

  return {
    totalAlocado,
    totalGasto,
    totalReservado,
    countAbertas: abertas.length,
  }
}

export function computeCashPosition(
  transactions: Transaction[],
  saldoInicial: number,
  bills: ReservedBill[],
): CashPosition
{
  const ledger = summarizeLedger(transactions, saldoInicial)
  const res = summarizeReservations(bills)

  return {
    ...ledger,
    saldoInicial,
    reservaRestante: res.totalReservado,
    saldoDisponivel: ledger.saldoCorrente - res.totalReservado,
    saldoProjetadoDisponivel: ledger.saldoProjetado - res.totalReservado,
  }
}

export function billProgress(bill: ReservedBill): number
{
  if (bill.valor_alocado <= 0) return 0
  return Math.min(100, (bill.valor_gasto / bill.valor_alocado) * 100)
}

export function billRemaining(bill: ReservedBill): number
{
  return Math.max(0, bill.valor_alocado - bill.valor_gasto)
}

/** Quanto de um lançamento pode abater na fatura */
export function applySpendToBill(bill: ReservedBill, valor: number): number
{
  const room = billRemaining(bill)
  return Math.min(valor, room)
}

export function nextBillStatus(bill: ReservedBill, valorGasto: number): ReservedBill['status']
{
  if (bill.status === 'cancelada') return 'cancelada'
  if (valorGasto >= bill.valor_alocado) return 'quitada'
  return 'aberta'
}
