import type { ReservedBill, ReservedBillItem } from '../store/storeTypes'
import { billProgress } from './financeReservedBills'
import { resolveBillItemHighlight } from './financeBillItems'

/** Situação visual da fatura - cor e badge */
export type BillVisualStatus =
  | 'tranquila'
  | 'vencendo'
  | 'urgente'
  | 'consumindo'
  | 'esgotada'
  | 'alerta_itens'

export type BillFilterKey = 'todas' | 'urgentes' | 'vencendo' | 'parcelas'

export function daysUntilDue(dueDate: string, reference = new Date()): number
{
  const due = new Date(`${dueDate.slice(0, 10)}T12:00:00`)
  const ref = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate(), 12)
  return Math.ceil((due.getTime() - ref.getTime()) / 86_400_000)
}

export function formatDueLabel(days: number): string
{
  if (days < 0) return `${Math.abs(days)}d atraso`
  if (days === 0) return 'Hoje'
  if (days === 1) return 'Amanhã'
  return `em ${days}d`
}

function hasAlertItems(items: ReservedBillItem[]): boolean
{
  return items.some((item) =>
  {
    const h = resolveBillItemHighlight(item)
    return h === 'erro' || h === 'acabando' || h === 'ultima'
  })
}

/** Prioridade: vencimento → consumo → itens */
export function resolveBillVisualStatus(
  bill: ReservedBill,
  items: ReservedBillItem[] = [],
): BillVisualStatus
{
  const pct = billProgress(bill)
  const days = daysUntilDue(bill.data_vencimento)

  if (days < 0 || days <= 3) return 'urgente'
  if (days <= 7) return 'vencendo'
  if (pct >= 100) return 'esgotada'
  if (pct >= 85) return 'consumindo'
  if (hasAlertItems(items)) return 'alerta_itens'
  return 'tranquila'
}

export function billMatchesFilter(
  status: BillVisualStatus,
  items: ReservedBillItem[],
  filter: BillFilterKey,
): boolean
{
  if (filter === 'todas') return true
  if (filter === 'urgentes') return status === 'urgente'
  if (filter === 'vencendo') return status === 'vencendo' || status === 'urgente'
  if (filter === 'parcelas')
  {
    return hasAlertItems(items) || items.some((i) => i.parcela_atual != null)
  }
  return true
}

export function statusSortWeight(status: BillVisualStatus): number
{
  const order: BillVisualStatus[] = [
    'urgente',
    'vencendo',
    'alerta_itens',
    'consumindo',
    'esgotada',
    'tranquila',
  ]
  return order.indexOf(status)
}
