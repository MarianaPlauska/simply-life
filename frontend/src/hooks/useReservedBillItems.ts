import { useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { itemsForBill } from '../lib/financeBillItems'

/** Itens discriminantes agrupados por fatura */
export function useReservedBillItems(billId: number)
{
  const allItems = useTaskStore((s) => s.reservedBillItems)

  return useMemo(
    () => itemsForBill(allItems, billId),
    [allItems, billId],
  )
}
