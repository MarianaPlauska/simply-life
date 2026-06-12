import type { RecurringIncome } from '../store/storeTypes'

const STORAGE_KEY = 'simply-life-finance-recurring-income'

export function loadRecurringIncomesLocal(): RecurringIncome[]
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecurringIncome[]
    return Array.isArray(parsed) ? parsed : []
  }
  catch
  {
    return []
  }
}

export function persistRecurringIncomesLocal(items: RecurringIncome[]): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function isMockRecurringIncomeId(id: number): boolean
{
  return id >= 920_001 && id < 921_000
}
