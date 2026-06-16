import type { ContaFixa, ReservedBill, Transaction, VirtualCard } from '../store/storeTypes'
import { getUpcomingBills } from './financeBillOrchestrator'

export const BILL_URGENCY_HOURS = 48

export interface BillsUrgencyInput
{
  contasFixas: ContaFixa[]
  reservedBills: ReservedBill[]
  cards?: VirtualCard[]
  transactions?: Transaction[]
}

/** Contas com vencimento em até N horas */
export function countBillsDueWithinHours(
  input: BillsUrgencyInput,
  hours = BILL_URGENCY_HOURS,
  ref = new Date(),
): number
{
  const maxDays = Math.ceil(hours / 24)
  const bills = getUpcomingBills({
    ...input,
    windowDays: maxDays,
    reference: ref,
  })
  return bills.filter((b) => b.diasRestantes * 24 <= hours || b.diasRestantes === 0).length
}
