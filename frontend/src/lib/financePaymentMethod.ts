import type { Transaction, VirtualCard } from '../store/storeTypes'

/** Meio de pagamento explícito — persistido em despesas.forma_pagamento */
export type FinancePaymentMethod =
  | 'pix'
  | 'debito'
  | 'dinheiro'
  | 'boleto'
  | 'cartao'
  | 'ted'
  | 'outro'

export const PAYMENT_METHOD_LABELS: Record<FinancePaymentMethod, string> = {
  pix: 'PIX',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
  cartao: 'Cartão',
  ted: 'TED / transferência',
  outro: 'Outro',
}

export const EXPENSE_CASH_METHODS: FinancePaymentMethod[] = [
  'pix',
  'debito',
  'dinheiro',
  'boleto',
]

export const INCOME_METHODS: FinancePaymentMethod[] = [
  'pix',
  'ted',
  'dinheiro',
  'outro',
]

/** Valor do picker para conta corrente (sem cartão) */
export const ACCOUNT_PAYMENT_SELECTION = 'conta'

export const DEFAULT_EXPENSE_PAYMENT = ACCOUNT_PAYMENT_SELECTION
export const DEFAULT_INCOME_PAYMENT = ACCOUNT_PAYMENT_SELECTION

export function isCardPaymentSelection(
  selection: string,
  cards: VirtualCard[],
): boolean
{
  return cards.some((c) => c.id === selection)
}

/** Infere rótulo para lançamentos antigos sem forma_pagamento */
export function inferPaymentMethod(t: Transaction): FinancePaymentMethod
{
  if (t.forma_pagamento)
  {
    return t.forma_pagamento
  }

  if (t.card_id && t.tipo === 'despesa')
  {
    return 'cartao'
  }

  if (t.tipo === 'receita')
  {
    return 'pix'
  }

  if (t.status_pagamento === 'agendado')
  {
    return 'boleto'
  }

  return 'debito'
}

export function paymentMethodLabel(t: Transaction): string
{
  return PAYMENT_METHOD_LABELS[inferPaymentMethod(t)]
}

export function resolvePaymentFromSelection(
  selection: string,
  cards: VirtualCard[],
): { card_id?: string; forma_pagamento?: FinancePaymentMethod }
{
  if (selection === ACCOUNT_PAYMENT_SELECTION)
  {
    return { forma_pagamento: 'debito' }
  }

  if (isCardPaymentSelection(selection, cards))
  {
    return { card_id: selection, forma_pagamento: 'cartao' }
  }

  const method = selection as FinancePaymentMethod
  if (PAYMENT_METHOD_LABELS[method])
  {
    return { forma_pagamento: method }
  }

  return { forma_pagamento: 'debito' }
}

/** Valor inicial do picker a partir de uma transação */
export function paymentPickerValue(t: Transaction): string
{
  if (t.card_id && t.tipo === 'despesa')
  {
    return t.card_id
  }

  return ACCOUNT_PAYMENT_SELECTION
}
