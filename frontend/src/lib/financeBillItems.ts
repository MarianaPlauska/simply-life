import type { ReservedBillItem } from '../store/storeTypes'

export type BillItemHighlight = 'acabando' | 'ultima' | 'erro' | null

export function resolveBillItemHighlight(item: ReservedBillItem): BillItemHighlight
{
  if (item.destaque === 'erro') return 'erro'

  const atual = item.parcela_atual
  const total = item.parcela_total
  if (atual == null || total == null || total <= 0) return null

  if (atual >= total) return 'ultima'
  if (atual >= total - 1) return 'acabando'
  return null
}

export function formatParcelaLabel(item: ReservedBillItem): string | null
{
  if (item.parcela_atual == null || item.parcela_total == null) return null
  return `${item.parcela_atual}/${item.parcela_total}`
}

export function itemsForBill(items: ReservedBillItem[], billId: number): ReservedBillItem[]
{
  return items
    .filter((i) => i.fatura_reserva_id === billId)
    .sort((a, b) => (a.created_at ?? '').localeCompare(b.created_at ?? ''))
}

export function sumBillItems(items: ReservedBillItem[], billId: number): number
{
  return itemsForBill(items, billId).reduce((s, i) => s + i.valor, 0)
}
