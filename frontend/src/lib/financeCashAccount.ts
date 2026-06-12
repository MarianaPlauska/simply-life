import type { CashAccountSettings } from '../store/storeTypes'

const STORAGE_KEY = 'simply-life-cash-initial'

export function loadCashAccountLocal(): CashAccountSettings
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { saldo_inicial: 0 }
    const parsed = JSON.parse(raw) as CashAccountSettings
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

export function persistCashAccountLocal(settings: CashAccountSettings): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}
