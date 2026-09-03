// Quitação de tarefa financeira - roteia caixa vs cartão

import type { Transaction, VirtualCard } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { cardUsaExtrato } from './financeCardModalidade'
import { billIdFromTask } from './financeBillOrchestrator'
import {
  billCanonicalKey,
  parseBillAmountFromTitle,
  parseBillNameFromTitle,
} from './financeBillTaskDedup'
import { postBillPaymentExpense } from './financeBillPayment'

function todayIso(): string
{
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tituloDescricao(titulo: string): string
{
  const nome = parseBillNameFromTitle(titulo)
  return (nome ?? titulo.replace(/^\[Boleto\]\s*/i, '').split(/\s*[---]\s*/)[0]).trim()
}

function findPendingCardTx(
  transactions: Transaction[],
  titulo: string,
  valor: number,
  cardId?: string,
): Transaction | undefined
{
  const nome = tituloDescricao(titulo).toLowerCase()
  return transactions.find((t) =>
  {
    if (t.tipo !== 'despesa' || !t.card_id) return false
    if (cardId && t.card_id !== cardId) return false
    const status = t.status_pagamento ?? 'pendente'
    if (status !== 'pendente' && status !== 'agendado') return false
    if (Math.abs(t.valor - valor) >= 0.02) return false
    return t.descricao.toLowerCase().includes(nome.slice(0, Math.min(8, nome.length)))
      || nome.includes(t.descricao.toLowerCase().slice(0, 6))
  })
}

async function postCardSpend(
  input: {
    descricao: string
    valor: number
    cardId: string
    categoria?: string
    data?: string
    origem: 'kanban' | 'financeiro'
  },
  deps: {
    transactions: Transaction[]
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>
  },
): Promise<boolean>
{
  const pending = findPendingCardTx(
    deps.transactions,
    input.descricao,
    input.valor,
    input.cardId,
  )
  if (pending)
  {
    return false
  }

  const dup = deps.transactions.some((t) =>
    t.card_id === input.cardId
    && t.tipo === 'despesa'
    && (t.status_pagamento ?? 'pendente') === 'pago'
    && Math.abs(t.valor - input.valor) < 0.02
    && t.data.slice(0, 10) === (input.data ?? todayIso()),
  )
  if (dup)
  {
    return false
  }

  await deps.addTransaction({
    descricao: input.descricao.trim(),
    categoria: input.categoria ?? 'Contas',
    valor: input.valor,
    data: input.data ?? todayIso(),
    tipo: 'despesa',
    status_pagamento: 'pago',
    card_id: input.cardId,
    forma_pagamento: 'cartao',
    observacao: `Via ${input.origem === 'kanban' ? 'Kanban' : 'Finanças'}`,
  })
  return true
}

export async function postBillPaymentFromTask(
  tarefa: TarefaUnificada,
  deps: {
    transactions: Transaction[]
    cards: VirtualCard[]
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>
    markTransactionPaid: (id: number) => Promise<void>
    markReservedBillPaid: (billId: number) => Promise<void>
  },
): Promise<void>
{
  const billId = billIdFromTask(tarefa)
  const valor = parseBillAmountFromTitle(tarefa.titulo)
  const descricao = tituloDescricao(tarefa.titulo)
  const notas = (tarefa.notas_locais ?? '').toLowerCase()

  if (billId?.startsWith('tx-'))
  {
    const txId = Number.parseInt(billId.slice(3), 10)
    if (txId > 0)
    {
      await deps.markTransactionPaid(txId)
      return
    }
  }

  if (billId?.startsWith('reserva-'))
  {
    const reservaId = Number.parseInt(billId.slice(8), 10)
    if (reservaId > 0)
    {
      await deps.markReservedBillPaid(reservaId)
      return
    }
  }

  const cardFromBill = billId?.startsWith('card-') ? billId.slice(5) : null
  const cardHint = notas.includes('no cartão') || notas.includes('no cartao')
    || tarefa.titulo.toLowerCase().includes('cartão')
    || tarefa.titulo.toLowerCase().includes('cartao')
    || tarefa.titulo.toLowerCase().includes('vr')
    || tarefa.titulo.toLowerCase().includes('vale')

  const pendingAny = valor > 0
    ? findPendingCardTx(deps.transactions, tarefa.titulo, valor, cardFromBill ?? undefined)
    : undefined

  if (pendingAny)
  {
    await deps.markTransactionPaid(pendingAny.id)
    return
  }

  if (cardFromBill && valor > 0)
  {
    const card = deps.cards.find((c) => c.id === cardFromBill)
    if (card && (cardUsaExtrato(card.modalidade) || cardHint))
    {
      await postCardSpend(
        { descricao, valor, cardId: cardFromBill, origem: 'kanban' },
        deps,
      )
      return
    }
  }

  if (cardHint && valor > 0)
  {
    const vrCard = deps.cards.find((c) =>
      c.status === 'ativo' && (c.modalidade === 'vr' || c.modalidade === 'alimentacao'),
    )
    if (vrCard)
    {
      await postCardSpend(
        { descricao, valor, cardId: vrCard.id, origem: 'kanban' },
        deps,
      )
      return
    }
  }

  if (!billCanonicalKey(tarefa) && valor <= 0)
  {
    return
  }

  await postBillPaymentExpense(
    {
      titulo: tarefa.titulo,
      valor,
      data: todayIso(),
      origem: 'kanban',
    },
    deps,
  )
}
