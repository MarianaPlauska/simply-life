// Atalhos de gasto — lançamento em 1 clique (persistência local)
// Valores padrão vazios: o usuário define em Gerenciar ou ao lançar

import type { FinancePaymentMethod } from '../store/storeTypes'

export interface ExpensePreset
{
  id: string
  label: string
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
  { id: 'preset-pix', label: 'PIX', emoji: '⚡', categoria: 'outros', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-uber', label: 'Uber / 99', emoji: '🚗', categoria: 'transporte', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-almoco', label: 'Almoço', emoji: '🍽️', categoria: 'alimentacao', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-cafe', label: 'Café', emoji: '☕', categoria: 'alimentacao', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-mercado', label: 'Mercado', emoji: '🛒', categoria: 'alimentacao', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-farmacia', label: 'Farmácia', emoji: '💊', categoria: 'saude', status_pagamento: 'pago', forma_pagamento: 'pix' },
  { id: 'preset-assinatura', label: 'Assinatura', emoji: '📱', categoria: 'internet', status_pagamento: 'pendente', forma_pagamento: 'boleto' },
  { id: 'preset-gasolina', label: 'Combustível', emoji: '⛽', categoria: 'transporte', status_pagamento: 'pago', forma_pagamento: 'debito' },
  { id: 'preset-lazer', label: 'Lazer', emoji: '🎬', categoria: 'lazer', status_pagamento: 'pago', forma_pagamento: 'pix' },
]

export function loadExpensePresets(): ExpensePreset[]
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...DEFAULT_EXPENSE_PRESETS]
    const parsed = JSON.parse(raw) as ExpensePreset[]
    if (!Array.isArray(parsed) || parsed.length === 0)
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

export function persistExpensePresets(presets: ExpensePreset[]): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export function createPresetId(): string
{
  return `preset-${Date.now()}`
}
