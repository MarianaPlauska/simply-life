import type { RecurringIncome } from '../store/storeTypes'
import {
  getActiveStorageUserId,
  readScopedJson,
  writeScopedJson,
} from './userScopedStorage'

const STORAGE_KEY = 'simply-life-finance-recurring-income'

export function loadRecurringIncomesLocal(userId?: string | null): RecurringIncome[]
{
  try
  {
    const parsed = readScopedJson<RecurringIncome[]>(STORAGE_KEY, userId ?? getActiveStorageUserId())
    return Array.isArray(parsed) ? parsed : []
  }
  catch
  {
    return []
  }
}

export function persistRecurringIncomesLocal(items: RecurringIncome[], userId?: string | null): void
{
  writeScopedJson(STORAGE_KEY, items, userId ?? getActiveStorageUserId())
}

export function isMockRecurringIncomeId(id: number): boolean
{
  return id >= 920_001 && id < 921_000
}
