import type { CashAccountSettings } from '../store/storeTypes'

const STORAGE_KEY = 'simply-life-cash-initial'

export function loadCashAccountLocal(): CashAccountSettings
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { saldo_inicial: 0 }
    const parsed = JSON.parse(raw) as CashAccountSettings
    return { saldo_inicial: Number(parsed.saldo_inicial) || 0 }
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
