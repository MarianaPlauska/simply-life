import { summarizeLedger } from './financeLedger'
import { summarizeReservations } from './financeReservedBills'
import type { FinanceBillSettlement, ReservedBill, Transaction } from '../store/storeTypes'

/** Saldo inicial necessário para o Disponível bater com o valor informado */
export function computeSaldoInicialForTargetDisponivel(
  transactions: Transaction[],
  targetDisponivel: number,
  reservedBills: ReservedBill[],
  billSettlements: FinanceBillSettlement[] = [],
): number
{
  const reserva = summarizeReservations(reservedBills, {
    settlements: billSettlements,
    transactions,
  }).totalReservado
  const targetCorrente = targetDisponivel + reserva
  const movimento = summarizeLedger(transactions, 0).saldoCorrente
  return targetCorrente - movimento
}
