import type { Transaction, VirtualCard } from '../store/storeTypes'
import { transactionDayKey } from './financeLedger'

// Ciclo de fatura do cartão — fechamento, vencimento, compras na fatura aberta

export interface BillingCycle
{
  start: string
  end: string
  dueDate: string
  closingDay: number
  dueDay: number
  isOpen: boolean
  daysUntilClose: number
  daysUntilDue: number
  label: string
}

const fmtDay = (d: Date): string =>
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function clampClosingDay(day: number): number
{
  return Math.min(28, Math.max(1, day))
}

export function resolveClosingDay(card: VirtualCard): number
{
  if (card.dia_fechamento != null)
  {
    return clampClosingDay(card.dia_fechamento)
  }
  if (card.dia_vencimento != null)
  {
    return clampClosingDay(Math.max(1, card.dia_vencimento - 7))
  }
  return 1
}

export function resolveDueDay(card: VirtualCard): number
{
  return clampClosingDay(card.dia_vencimento ?? 10)
}

/** Fatura aberta ou última fechada conforme data de referência */
export function getBillingCycle(card: VirtualCard, reference = new Date()): BillingCycle
{
  const closingDay = resolveClosingDay(card)
  const dueDay = resolveDueDay(card)
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const day = reference.getDate()

  let endYear = y
  let endMonth = m

  if (day > closingDay)
  {
    endMonth += 1
    if (endMonth > 11)
    {
      endMonth = 0
      endYear += 1
    }
  }

  const cycleEnd = new Date(endYear, endMonth, closingDay)
  const cycleStart = new Date(endYear, endMonth - 1, closingDay + 1)

  let due = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth(), dueDay)
  if (due.getTime() <= cycleEnd.getTime())
  {
    due = new Date(cycleEnd.getFullYear(), cycleEnd.getMonth() + 1, dueDay)
  }

  const refMs = new Date(y, m, day).getTime()
  const isOpen = refMs <= cycleEnd.getTime() && refMs >= cycleStart.getTime()

  const daysUntilClose = Math.max(
    0,
    Math.ceil((cycleEnd.getTime() - refMs) / 86_400_000),
  )
  const daysUntilDue = Math.max(
    0,
    Math.ceil((due.getTime() - refMs) / 86_400_000),
  )

  const startLabel = cycleStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  const endLabel = cycleEnd.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

  return {
    start: fmtDay(cycleStart),
    end: fmtDay(cycleEnd),
    dueDate: fmtDay(due),
    closingDay,
    dueDay,
    isOpen,
    daysUntilClose,
    daysUntilDue,
    label: `${startLabel} → ${endLabel}`,
  }
}

export function getInvoiceTransactions(
  transactions: Transaction[],
  cardId: string,
  cycle: BillingCycle,
): Transaction[]
{
  return transactions.filter((t) =>
  {
    if (t.card_id !== cardId || t.tipo !== 'despesa') return false
    const key = transactionDayKey(t.data)
    return key >= cycle.start && key <= cycle.end
  })
}

export function sumInvoice(transactions: Transaction[]): number
{
  return transactions.reduce((s, t) => s + t.valor, 0)
}

export function invoiceUsagePct(spent: number, limit: number): number
{
  if (limit <= 0) return 0
  return Math.min(100, (spent / limit) * 100)
}
