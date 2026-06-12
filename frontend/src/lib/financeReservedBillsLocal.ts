import type { ReservedBill, ReservedBillItem } from '../store/storeTypes'
import {
  buildFinanceReservedBillsMock,
  type ReservedBillsMockSnapshot,
} from '../data/financeReservedBillsMock'

const STORAGE_KEY = 'simply-life-finance-reserved-bills'

export function isMockReservedBillId(id: number): boolean
{
  return id >= 900_001 && id < 901_000
}

export function isMockReservedBillItemId(id: number): boolean
{
  return id >= 910_001 && id < 911_000
}

export function loadReservedBillsLocal(): ReservedBillsMockSnapshot | null
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ReservedBillsMockSnapshot
    if (!Array.isArray(parsed.bills)) return null
    return parsed
  }
  catch
  {
    return null
  }
}

export function persistReservedBillsLocal(bills: ReservedBill[], items: ReservedBillItem[]): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ bills, items }))
}

/** Usado quando o Supabase não tem faturas — preview local */
export function ensureReservedBillsMock(): ReservedBillsMockSnapshot
{
  const saved = loadReservedBillsLocal()
  if (saved && saved.bills.length > 0) return saved

  const mock = buildFinanceReservedBillsMock()
  persistReservedBillsLocal(mock.bills, mock.items)
  return mock
}

export function snapshotFromStore(bills: ReservedBill[], items: ReservedBillItem[]): void
{
  if (!bills.some((b) => isMockReservedBillId(b.id))) return
  persistReservedBillsLocal(bills, items)
}
