import type { UpcomingBill } from './financeUpcomingBills'

/** Chave estável para agrupar o mesmo compromisso financeiro no mês */
export function payablesDedupKey(bill: Pick<UpcomingBill, 'label' | 'valor' | 'dueDate' | 'kind'>): string
{
  const label = bill.label
    .toLowerCase()
    .replace(/\s*\[fixa:\d+\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const month = bill.dueDate.slice(0, 7)
  return `${bill.kind}|${label}|${bill.valor.toFixed(2)}|${month}`
}

/** Remove duplicatas - mantém o item com menor transactionId ou primeiro da lista */
export function dedupeUpcomingBills(bills: UpcomingBill[]): UpcomingBill[]
{
  const byKey = new Map<string, UpcomingBill>()

  for (const bill of bills)
  {
    const key = payablesDedupKey(bill)
    const prev = byKey.get(key)
    if (!prev)
    {
      byKey.set(key, bill)
      continue
    }

    const prevTx = prev.transactionId ?? Number.MAX_SAFE_INTEGER
    const nextTx = bill.transactionId ?? Number.MAX_SAFE_INTEGER
    if (nextTx < prevTx)
    {
      byKey.set(key, bill)
    }
  }

  return [...byKey.values()].sort((a, b) => a.daysUntil - b.daysUntil)
}
