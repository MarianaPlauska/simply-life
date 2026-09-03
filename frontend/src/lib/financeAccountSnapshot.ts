import type { ReservedBill, Transaction, VirtualCard } from '../store/storeTypes'
import { computeCashPosition } from './financeReservedBills'
import { sumOpenInvoiceSpend } from './financeCardSpend'
import { resolveCashTone, resolveLimitTone, type BalanceTone } from './financeBalanceTone'

export interface AccountSnapshot
{
  id: string
  label: string
  kind: 'cash' | 'card'
  balance: number
  spent?: number
  limit?: number
  tone: BalanceTone
  hint?: string
}

export interface AccountPanelData
{
  snapshots: AccountSnapshot[]
  saldoInicial: number
  saldoDisponivel: number
  saldoProjetadoDisponivel: number
  reservaRestante: number
}

/** Painel de contas - caixa + cartões com saldo inicial e reservas */
export function buildAccountPanelData(
  allTransactions: Transaction[],
  cards: VirtualCard[],
  saldoInicial: number,
  reservedBills: ReservedBill[],
): AccountPanelData
{
  const position = computeCashPosition(allTransactions, saldoInicial, reservedBills)
  const cashTone = resolveCashTone(position.saldoDisponivel, position.saldoProjetadoDisponivel)

  const snapshots: AccountSnapshot[] = [
    {
      id: 'cash',
      label: 'Conta corrente',
      kind: 'cash',
      balance: position.saldoDisponivel,
      tone: cashTone,
      hint: `Disponível ${position.saldoDisponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · Comprometido ${position.reservaRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    },
  ]

  for (const card of cards.filter((c) => c.status === 'ativo'))
  {
    const spent = sumOpenInvoiceSpend(allTransactions, card)
    const available = card.limite - spent
    const tone = resolveLimitTone(spent, card.limite)

    snapshots.push({
      id: card.id,
      label: card.nome,
      kind: 'card',
      balance: available,
      spent,
      limit: card.limite,
      tone,
      hint: `Fatura ${spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    })
  }

  return {
    snapshots,
    saldoInicial,
    saldoDisponivel: position.saldoDisponivel,
    saldoProjetadoDisponivel: position.saldoProjetadoDisponivel,
    reservaRestante: position.reservaRestante,
  }
}
