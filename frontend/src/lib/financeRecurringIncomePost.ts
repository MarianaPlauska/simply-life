import type { RecurringIncome, Transaction } from '../store/storeTypes'
import { effectiveDueDay } from './financeRecurringPost'

export const RECORRENTE_MARKER_RE = /\[receita-recorrente:(\d+)\]/

export function receitaRecorrenteMarker(id: number): string
{
  return `[receita-recorrente:${id}]`
}

export function isReceitaRecorrenteDueToday(item: RecurringIncome, ref = new Date()): boolean
{
  if (!item.ativa) return false
  return ref.getDate() === effectiveDueDay(item.dia_recebimento, ref)
}

export function isReceitaRecorrentePostedThisMonth(
  itemId: number,
  transactions: Transaction[],
  ref = new Date(),
): boolean
{
  const y = ref.getFullYear()
  const m = ref.getMonth()

  return transactions.some((t) =>
  {
    const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
    if (d.getFullYear() !== y || d.getMonth() !== m) return false
    const match = t.descricao.match(RECORRENTE_MARKER_RE)
    return match != null && Number(match[1]) === itemId
  })
}

export function buildAutoPostReceitaRecorrente(
  item: RecurringIncome,
  ref = new Date(),
): Omit<Transaction, 'id'>
{
  const today = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(ref.getDate()).padStart(2, '0')}`

  return {
    descricao: `${item.titulo} ${receitaRecorrenteMarker(item.id)}`,
    valor: item.valor,
    tipo: 'receita',
    categoria: 'receita',
    categoria_id: item.categoria_id,
    data: today,
    status_pagamento: 'pago',
    forma_pagamento: 'pix',
  }
}
