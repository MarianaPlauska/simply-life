import type { ContaFixa, FinanceBillSettlement, Transaction } from '../store/storeTypes'
import { isPaidInSettlements } from './financeLedgerReconcile'
import { hasPaidExpenseForBill } from './financeBillPayment'

export const FIXA_MARKER_RE = /\[fixa:(\d+)\]/

export function fixaMarker(contaId: number): string
{
  return `[fixa:${contaId}]`
}

export function stripFixaMarker(descricao: string): string
{
  return descricao.replace(/\s*\[fixa:\d+\]/, '').trim()
}

/** Dia efetivo de vencimento no mês (ex.: dia 31 em fevereiro → 28) */
export function effectiveDueDay(diaVencimento: number, ref = new Date()): number
{
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  return Math.min(Math.max(1, diaVencimento), daysInMonth)
}

export function isContaFixaDueToday(conta: ContaFixa, ref = new Date()): boolean
{
  if (!conta.ativa) return false
  return ref.getDate() === effectiveDueDay(conta.dia_vencimento, ref)
}

export function isContaFixaPostedThisMonth(
  contaId: number,
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
    const match = t.descricao.match(FIXA_MARKER_RE)
    return match != null && Number(match[1]) === contaId
  })
}

/** Fixa já lançada ou quitada no mês - evita auto-post e tarefa fantasma */
export function isContaFixaSatisfiedThisMonth(
  conta: ContaFixa,
  transactions: Transaction[],
  settlements: FinanceBillSettlement[] = [],
  ref = new Date(),
): boolean
{
  if (isContaFixaPostedThisMonth(conta.id, transactions, ref))
  {
    return true
  }

  const monthKey = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`
  const tituloComMarker = `${conta.nome} ${fixaMarker(conta.id)}`

  if (hasPaidExpenseForBill(transactions, tituloComMarker, conta.valor, monthKey))
  {
    return true
  }
  if (hasPaidExpenseForBill(transactions, conta.nome, conta.valor, monthKey))
  {
    return true
  }
  if (isPaidInSettlements(conta.nome, conta.valor, settlements))
  {
    return true
  }

  return false
}

export function findContaFixaTransaction(
  contaId: number,
  transactions: Transaction[],
  ref = new Date(),
): Transaction | undefined
{
  const y = ref.getFullYear()
  const m = ref.getMonth()

  return transactions.find((t) =>
  {
    const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
    if (d.getFullYear() !== y || d.getMonth() !== m) return false
    const match = t.descricao.match(FIXA_MARKER_RE)
    return match != null && Number(match[1]) === contaId
  })
}

export interface AutoPostContaFixaInput
{
  conta: ContaFixa
  ref?: Date
}

export function buildAutoPostTransaction(input: AutoPostContaFixaInput): Omit<Transaction, 'id'>
{
  const ref = input.ref ?? new Date()
  const today = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}-${String(ref.getDate()).padStart(2, '0')}`

  return {
    descricao: `${input.conta.nome} ${fixaMarker(input.conta.id)}`,
    valor: input.conta.valor,
    tipo: 'despesa',
    categoria: input.conta.categoria || 'outros',
    data: today,
    status_pagamento: 'pendente',
    forma_pagamento: 'boleto',
  }
}
