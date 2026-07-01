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

/** Dia de vencimento cadastrado pelo usuário — sem inferência */
export function resolveDueDay(card: VirtualCard): number | null
{
  if (card.dia_vencimento == null) return null
  return clampClosingDay(card.dia_vencimento)
}

/** Próxima data civil para um dia do mês (ex.: fechamento dia 11) */
export function nextCalendarDateForDay(dayOfMonth: number, reference = new Date()): string
{
  const day = clampClosingDay(dayOfMonth)
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const today = reference.getDate()

  let endYear = y
  let endMonth = m

  if (today > day)
  {
    endMonth += 1
    if (endMonth > 11)
    {
      endMonth = 0
      endYear += 1
    }
  }

  return fmtDay(new Date(endYear, endMonth, day))
}

/** Vencimento da fatura fechada em cycleEnd (mesmo mês se dueDay > closingDay) */
export function resolveDueDateForCycleEnd(cycleEnd: Date, closingDay: number, dueDay: number): Date
{
  const y = cycleEnd.getFullYear()
  const m = cycleEnd.getMonth()

  if (dueDay > closingDay)
  {
    return new Date(y, m, dueDay)
  }

  return new Date(y, m + 1, dueDay)
}

/** Vencimento a partir da próxima data de fechamento e dos dias cadastrados */
export function dueDateFromUserBillingDays(
  card: VirtualCard,
  reference = new Date(),
): { fecha: string; vence: string } | null
{
  if (card.dia_fechamento == null || card.dia_vencimento == null) return null

  const closingDay = clampClosingDay(card.dia_fechamento)
  const dueDay = clampClosingDay(card.dia_vencimento)
  const fecha = nextCalendarDateForDay(closingDay, reference)
  const cycleEnd = new Date(`${fecha}T12:00:00`)
  const vence = fmtDay(resolveDueDateForCycleEnd(cycleEnd, closingDay, dueDay))

  return { fecha, vence }
}

/** Fatura aberta ou última fechada conforme data de referência */
export function getBillingCycle(card: VirtualCard, reference = new Date()): BillingCycle
{
  const closingDay = resolveClosingDay(card)
  const dueDay = resolveDueDay(card) ?? closingDay
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
  const due = resolveDueDateForCycleEnd(cycleEnd, closingDay, dueDay)

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
