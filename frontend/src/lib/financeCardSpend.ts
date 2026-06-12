import type { Transaction, VirtualCard } from '../store/storeTypes'
import {
  getBillingCycle,
  getInvoiceTransactions,
  sumInvoice,
} from './financeCardCycle'

/** Gasto na fatura aberta — abate limite do cartão (não mexe no caixa) */
export function sumOpenInvoiceSpend(
  transactions: Transaction[],
  card: VirtualCard,
  reference = new Date(),
): number
{
  const cycle = getBillingCycle(card, reference)
  const invoiceTx = getInvoiceTransactions(transactions, card.id, cycle)
  return sumInvoice(invoiceTx)
}

export function cardAvailableLimit(
  transactions: Transaction[],
  card: VirtualCard,
  reference = new Date(),
): number
{
  return card.limite - sumOpenInvoiceSpend(transactions, card, reference)
}

export function cardLimitUsagePct(
  transactions: Transaction[],
  card: VirtualCard,
  reference = new Date(),
): number
{
  if (card.limite <= 0) return 0
  const spent = sumOpenInvoiceSpend(transactions, card, reference)
  return Math.min(100, (spent / card.limite) * 100)
}
