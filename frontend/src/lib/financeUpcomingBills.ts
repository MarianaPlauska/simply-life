import type { ContaFixa, FinanceBillSettlement, ReservedBill, Transaction, VirtualCard } from '../store/storeTypes'
import { billRemaining } from './financeReservedBills'
import { isBillDismissed } from './financeBillDismiss'
import { isContaFixaSatisfiedThisMonth } from './financeRecurringPost'
import { contaFixaEfetivamenteAtiva } from './financeContaFixa'
import { getBillingCycle, getInvoiceTransactions, sumInvoice } from './financeCardCycle'
import { transactionDayKey } from './financeLedger'
import { dedupeUpcomingBills } from './financePayablesDedup'

export interface UpcomingBill
{
  id: string
  label: string
  valor: number
  dueDate: string
  daysUntil: number
  kind: 'conta_fixa' | 'cartao_fatura' | 'agendado' | 'pendente' | 'fatura_reserva'
  hint?: string
  transactionId?: number
  cardId?: string
  reservedBillId?: number
}

function fmtDay(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function daysBetween(from: Date, to: Date): number
{
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  return Math.ceil((b.getTime() - a.getTime()) / 86_400_000)
}

function nextContaFixaDate(conta: ContaFixa, reference = new Date()): string
{
  const y = reference.getFullYear()
  const m = reference.getMonth()
  const day = Math.min(28, Math.max(1, conta.dia_vencimento))
  let candidate = new Date(y, m, day)
  if (candidate.getTime() < reference.getTime())
  {
    candidate = new Date(y, m + 1, day)
  }
  return fmtDay(candidate)
}

export function buildUpcomingBills(
  options: {
    contasFixas: ContaFixa[]
    cards: VirtualCard[]
    transactions: Transaction[]
    reservedBills?: ReservedBill[]
    settlements?: FinanceBillSettlement[]
    horizonDays?: number
    reference?: Date
    includeDismissed?: boolean
  },
): UpcomingBill[]
{
  const reference = options.reference ?? new Date()
  const horizon = options.horizonDays ?? 45
  const bills: UpcomingBill[] = []

  const keep = (bill: UpcomingBill): boolean =>
  {
    if (options.includeDismissed) return true
    return !isBillDismissed(bill.id, reference)
  }

  for (const bill of options.reservedBills?.filter((b) => b.status === 'aberta') ?? [])
  {
    const rest = billRemaining(bill)
    if (rest <= 0) continue

    const dueDate = bill.data_vencimento.slice(0, 10)
    const daysUntil = daysBetween(reference, new Date(`${dueDate}T12:00:00`))
    if (daysUntil < 0 || daysUntil > horizon) continue

    const candidate: UpcomingBill = {
      id: `reserva-${bill.id}`,
      label: bill.titulo,
      valor: rest,
      dueDate,
      daysUntil,
      kind: 'fatura_reserva',
      hint: 'Fatura reservada',
      reservedBillId: bill.id,
      cardId: bill.card_id,
    }
    if (keep(candidate)) bills.push(candidate)
  }

  for (const conta of options.contasFixas.filter((c) => contaFixaEfetivamenteAtiva(c, reference)))
  {
    if (isContaFixaSatisfiedThisMonth(
      conta,
      options.transactions,
      options.settlements ?? [],
      reference,
    )) continue

    const dueDate = nextContaFixaDate(conta, reference)
    const daysUntil = daysBetween(reference, new Date(`${dueDate}T12:00:00`))
    if (daysUntil >= 0 && daysUntil <= horizon)
    {
      const candidate: UpcomingBill = {
        id: `fixa-${conta.id}`,
        label: conta.nome,
        valor: conta.valor,
        dueDate,
        daysUntil,
        kind: 'conta_fixa',
        hint: 'Conta fixa',
      }
      if (keep(candidate)) bills.push(candidate)
    }
  }

  for (const card of options.cards.filter((c) => c.status === 'ativo'))
  {
    const cycle = getBillingCycle(card, reference)
    const invoiceTx = getInvoiceTransactions(options.transactions, card.id, cycle)
    const total = sumInvoice(invoiceTx)
    const daysUntil = daysBetween(reference, new Date(`${cycle.dueDate}T12:00:00`))

    if (daysUntil >= 0 && daysUntil <= horizon)
    {
      const candidate: UpcomingBill = {
        id: `card-${card.id}`,
        label: `Fatura ${card.nome}`,
        valor: total > 0 ? total : card.limite * 0.1,
        dueDate: cycle.dueDate,
        daysUntil,
        kind: 'cartao_fatura',
        hint: total > 0 ? `Fatura aberta ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` : 'Previsão de fatura',
        cardId: card.id,
      }
      if (keep(candidate)) bills.push(candidate)
    }
  }

  for (const t of options.transactions)
  {
    const status = t.status_pagamento ?? 'pendente'
    if (t.tipo !== 'despesa') continue
    if (status === 'pago') continue

    // Gasto no cartão entra na fatura — não gera alerta de "conta vence"
    if (t.card_id) continue

    // Só contas futuras/agendadas ou pendentes com vencimento futuro
    if (status !== 'agendado' && status !== 'pendente') continue

    const dueDate = transactionDayKey(t.data)
    const daysUntil = daysBetween(reference, new Date(`${dueDate}T12:00:00`))
    if (daysUntil < 0 || daysUntil > horizon) continue

    // Pendente com vencimento hoje = gasto já registrado no momento
    if (status === 'pendente' && daysUntil === 0) continue

    const candidate: UpcomingBill = {
      id: `tx-${t.id}`,
      label: t.descricao,
      valor: t.valor,
      dueDate,
      daysUntil,
      kind: status === 'agendado' ? 'agendado' : 'pendente',
      hint: t.forma_pagamento === 'pix' ? 'PIX' : t.card_id ? 'No cartão' : 'Conta corrente',
      transactionId: t.id,
    }
    if (keep(candidate)) bills.push(candidate)
  }

  return dedupeUpcomingBills(bills.sort((a, b) => a.daysUntil - b.daysUntil))
}
