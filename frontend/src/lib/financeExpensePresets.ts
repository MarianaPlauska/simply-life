// Atalhos de gasto — lançamento em 1 clique (persistência local por usuário)

import type { FinancePaymentMethod } from '../store/storeTypes'
import {
  getActiveStorageUserId,
  readScopedJson,
  writeScopedJson,
} from './userScopedStorage'

export interface ExpensePreset
{
  id: string
  label: string
  /** Chave do ícone Lucide — ver financePresetIcons */
  icon?: string
  /** @deprecated migrado para icon */
  emoji?: string
  valor?: number
  categoria_id?: number
  categoria?: string
  status_pagamento: 'pago' | 'pendente'
  forma_pagamento?: FinancePaymentMethod
  card_id?: string
}

const STORAGE_KEY = 'simply-life-finance-presets'

export const DEFAULT_EXPENSE_PRESETS: ExpensePreset[] = [
  { id: 'preset-pix', label: 'PIX', icon: 'qr-code', categoria: 'outros', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-uber', label: 'Uber / 99', icon: 'car', categoria: 'transporte', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-almoco', label: 'Almoço', icon: 'utensils', categoria: 'alimentacao', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-cafe', label: 'Café', icon: 'coffee', categoria: 'alimentacao', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-mercado', label: 'Mercado', icon: 'shopping-cart', categoria: 'alimentacao', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-farmacia', label: 'Farmácia', icon: 'pill', categoria: 'saude', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-assinatura', label: 'Assinatura', icon: 'smartphone', categoria: 'internet', status_pagamento: 'pendente', forma_pagamento: 'boleto' },
  { id: 'preset-gasolina', label: 'Combustível', icon: 'fuel', categoria: 'transporte', status_pagamento: 'pago', forma_pagamento: 'debito' },
  { id: 'preset-lazer', label: 'Lazer', icon: 'clapperboard', categoria: 'lazer', status_pagamento: 'pago', forma_pagamento: 'pix' },
]

export function loadExpensePresets(userId?: string | null): ExpensePreset[]
{
  try
  {
    const parsed = readScopedJson<ExpensePreset[]>(STORAGE_KEY, userId ?? getActiveStorageUserId())
    if (!parsed || !Array.isArray(parsed) || parsed.length === 0)
    {
      return [...DEFAULT_EXPENSE_PRESETS]
    }
    return parsed
  }
  catch
  {
    return [...DEFAULT_EXPENSE_PRESETS]
  }
}

export function persistExpensePresets(presets: ExpensePreset[], userId?: string | null): void
{
  writeScopedJson(STORAGE_KEY, presets, userId ?? getActiveStorageUserId())
}

export function createPresetId(): string
{
  return `preset-${Date.now()}`
}
