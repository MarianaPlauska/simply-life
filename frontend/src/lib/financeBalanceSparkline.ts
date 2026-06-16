import { computeCashPosition } from './financeReservedBills'
import type { ReservedBill, Transaction } from '../store/storeTypes'

export interface BalanceSparklinePoint
{
  key: string
  saldo: number
}

/** Saldo disponível nos últimos N dias (para sparkline do dashboard) */
export function buildBalanceSparkline(
  transactions: Transaction[],
  saldoInicial: number,
  reservedBills: ReservedBill[],
  days = 7,
): BalanceSparklinePoint[]
{
  const keys: string[] = []
  const d = new Date()
  for (let i = days - 1; i >= 0; i--)
  {
    const copy = new Date(d)
    copy.setDate(d.getDate() - i)
    keys.push(copy.toISOString().slice(0, 10))
  }

  return keys.map((key) =>
  {
    const txUntil = transactions.filter((t) => t.data <= key)
    const pos = computeCashPosition(txUntil, saldoInicial, reservedBills)
    return { key, saldo: pos.saldoDisponivel }
  })
}
