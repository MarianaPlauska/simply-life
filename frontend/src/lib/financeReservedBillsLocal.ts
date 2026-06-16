import type { ReservedBill, ReservedBillItem } from '../store/storeTypes'

const STORAGE_KEY = 'simply-life-finance-reserved-bills'

export interface ReservedBillsLocalSnapshot
{
  bills: ReservedBill[]
  items: ReservedBillItem[]
}

export function isMockReservedBillId(id: number): boolean
{
  return id >= 900_001 && id < 901_000
}

export function isMockReservedBillItemId(id: number): boolean
{
  return id >= 910_001 && id < 911_000
}

export function loadReservedBillsLocal(): ReservedBillsLocalSnapshot | null
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ReservedBillsLocalSnapshot
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

/** Retorno vazio quando não há faturas no Supabase */
export function ensureReservedBillsMock(): ReservedBillsLocalSnapshot
{
  const saved = loadReservedBillsLocal()
  if (saved && saved.bills.length > 0) return saved

  return { bills: [], items: [] }
}

export function snapshotFromStore(bills: ReservedBill[], items: ReservedBillItem[]): void
{
  if (!bills.some((b) => isMockReservedBillId(b.id))) return
  persistReservedBillsLocal(bills, items)
}
