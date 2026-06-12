import { paymentMethodLabel } from './financePaymentMethod'
import type { Transaction, VirtualCard } from '../store/storeTypes'

const TIPO_LABEL: Record<Transaction['tipo'], string> = {
  receita: 'Receita',
  despesa: 'Despesa',
  investimento: 'Investimento',
}

export function spreadsheetTipoLabel(tipo: Transaction['tipo']): string
{
  return TIPO_LABEL[tipo] ?? tipo
}

export function resolveSpreadsheetAccount(t: Transaction, cards: VirtualCard[]): string
{
  if (t.card_id)
  {
    return cards.find((c) => c.id === t.card_id)?.nome ?? 'Cartão'
  }

  if (t.fatura_reserva_id) return 'Fatura reservada'
  return 'Caixa'
}

export function resolveSpreadsheetPaymentMethod(t: Transaction): string
{
  if (t.status_pagamento === 'agendado') return 'Agendado'
  if (t.status_pagamento === 'pendente') return 'Pendente'
  return paymentMethodLabel(t)
}

export function resolvePaymentDate(t: Transaction): string
{
  const status = t.status_pagamento ?? 'pendente'
  if (status !== 'pago') return '—'

  const iso = t.data.slice(0, 10)
  return iso.split('-').reverse().join('/')
}

export function formatSpreadsheetDate(iso: string): string
{
  return iso.slice(0, 10).split('-').reverse().join('/')
}
