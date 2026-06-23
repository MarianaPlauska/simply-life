import type { Transaction, VirtualCard } from '../store/storeTypes'
import { cardTemCicloFatura } from './financeCardModalidade'
import {
  getBillingCycle,
  getInvoiceTransactions,
  sumInvoice,
} from './financeCardCycle'

/** Gasto no cartão — fatura aberta (crédito) ou total (VR/vale/débito) */
export function sumCardTotalSpend(
  transactions: Transaction[],
  cardId: string,
): number
{
  return transactions
    .filter((t) => t.card_id === cardId && t.tipo === 'despesa')
    .reduce((s, t) => s + t.valor, 0)
}

export function sumOpenInvoiceSpend(
  transactions: Transaction[],
  card: VirtualCard,
  reference = new Date(),
): number
{
  if (!cardTemCicloFatura(card.modalidade))
  {
    return sumCardTotalSpend(transactions, card.id)
  }

  const cycle = getBillingCycle(card, reference)
  const invoiceTx = getInvoiceTransactions(transactions, card.id, cycle)
  return sumInvoice(invoiceTx)
}

export function cardAvailableLimit(
  transactions: Transaction[],
  card: VirtualCard,
  reference = new Date(),
): number
{
  return card.limite - sumOpenInvoiceSpend(transactions, card, reference)
}

export function cardLimitUsagePct(
  transactions: Transaction[],
  card: VirtualCard,
  reference = new Date(),
): number
{
  if (card.limite <= 0) return 0
  const spent = sumOpenInvoiceSpend(transactions, card, reference)
  return Math.min(100, (spent / card.limite) * 100)
}

export interface CardSpendValidation
{
  ok: boolean
  available: number
  message?: string
}

const fmtBrl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Impede gasto acima do saldo/limite disponível no cartão */
export function validateCardSpend(
  transactions: Transaction[],
  card: VirtualCard,
  amount: number,
  reference = new Date(),
): CardSpendValidation
{
  if (card.status === 'bloqueado')
  {
    return { ok: false, available: 0, message: `O cartão ${card.nome} está bloqueado.` }
  }

  const available = cardAvailableLimit(transactions, card, reference)

  if (amount > available + 0.009)
  {
    return {
      ok: false,
      available: Math.max(0, available),
      message: available <= 0
        ? `Sem saldo no ${card.nome}. Limite esgotado.`
        : `Valor acima do disponível no ${card.nome}. Restam ${fmtBrl(available)}.`,
    }
  }

  return { ok: true, available: Math.max(0, available) }
}

export function getCardExtratoTransactions(
  transactions: Transaction[],
  cardId: string,
): Transaction[]
{
  return transactions
    .filter((t) => t.card_id === cardId && t.tipo === 'despesa')
    .sort((a, b) =>
    {
      const cmp = b.data.localeCompare(a.data)
      if (cmp !== 0) return cmp
      return b.id - a.id
    })
}

export interface ExtratoLinha
{
  tx: Transaction
  saldoApos: number
  quandoLabel: string
}

/** Extrato com saldo após cada lançamento (mais recente primeiro) */
export function buildExtratoLinhas(
  transactions: Transaction[],
  card: VirtualCard,
): ExtratoLinha[]
{
  const lista = getCardExtratoTransactions(transactions, card.id)
  const asc = [...lista].sort((a, b) =>
  {
    const cmp = a.data.localeCompare(b.data)
    if (cmp !== 0) return cmp
    return a.id - b.id
  })

  let saldo = card.limite
  const comSaldo = asc.map((tx) =>
  {
    saldo -= tx.valor
    return {
      tx,
      saldoApos: saldo,
      quandoLabel: formatExtratoQuando(tx.data),
    }
  })

  return comSaldo.reverse()
}

function formatExtratoQuando(data: string): string
{
  const raw = data.trim()
  if (raw.includes('T'))
  {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime()))
    {
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  const dia = raw.slice(0, 10)
  const d = new Date(`${dia}T12:00:00`)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
