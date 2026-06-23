import type { CashAccountSettings } from '../store/storeTypes'
import {
  getActiveStorageUserId,
  readScopedJson,
  writeScopedJson,
} from './userScopedStorage'

const STORAGE_KEY = 'simply-life-cash-initial'

export function loadCashAccountLocal(userId?: string | null): CashAccountSettings
{
  try
  {
    const parsed = readScopedJson<CashAccountSettings>(STORAGE_KEY, userId ?? getActiveStorageUserId())
    if (!parsed) return { saldo_inicial: 0 }
    return {
      saldo_inicial: Number(parsed.saldo_inicial) || 0,
      saldo_banco: parsed.saldo_banco != null ? Number(parsed.saldo_banco) : null,
      saldo_banco_at: parsed.saldo_banco_at ?? null,
    }
  }
  catch
  {
    return { saldo_inicial: 0 }
  }
}

export function persistCashAccountLocal(settings: CashAccountSettings, userId?: string | null): void
{
  writeScopedJson(STORAGE_KEY, settings, userId ?? getActiveStorageUserId())
}
