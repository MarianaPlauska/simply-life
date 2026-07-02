import type { Transaction } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import {
  billCanonicalKey,
  parseBillAmountFromTitle,
  settlementCanonicalKey,
} from './financeBillTaskDedup'

function todayIso(): string
{
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthKeyFromIso(iso: string): string
{
  return iso.slice(0, 7)
}

/** Já existe despesa paga no caixa para este boleto no mês */
export function hasPaidExpenseForBill(
  transactions: Transaction[],
  titulo: string,
  valor: number,
  monthKey: string,
): boolean
{
  const canon = settlementCanonicalKey({ titulo, valor })
  const nome = canon.split('|')[1]

  return transactions.some((t) =>
  {
    if (t.tipo !== 'despesa') return false
    if ((t.status_pagamento ?? 'pendente') !== 'pago') return false
    if (!t.data.startsWith(monthKey)) return false
    const txCanon = settlementCanonicalKey({ titulo: t.descricao, valor: t.valor })
    if (txCanon === canon) return true
    return nome.length >= 3 && t.descricao.toLowerCase().includes(nome)
      && Math.abs(t.valor - valor) < 0.02
  })
}

/** Cria despesa paga no caixa quando boleto é quitado (Kanban ou Finanças) */
export async function postBillPaymentExpense(
  input: {
    titulo: string
    valor?: number
    data?: string
    origem: 'kanban' | 'financeiro'
  },
  deps: {
    transactions: Transaction[]
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>
  },
): Promise<boolean>
{
  const valor = input.valor && input.valor > 0
    ? input.valor
    : parseBillAmountFromTitle(input.titulo)
  if (valor <= 0) return false

  const data = input.data?.slice(0, 10) ?? todayIso()
  const monthKey = monthKeyFromIso(data)

  if (hasPaidExpenseForBill(deps.transactions, input.titulo, valor, monthKey))
  {
    return false
  }

  await deps.addTransaction({
    descricao: input.titulo.trim(),
    categoria: 'Contas',
    valor,
    data,
    tipo: 'despesa',
    status_pagamento: 'pago',
    forma_pagamento: 'pix',
    observacao: `Pago via ${input.origem === 'kanban' ? 'Kanban' : 'Finanças'}`,
  })

  return true
}

export async function postBillPaymentFromTask(
  tarefa: TarefaUnificada,
  deps: {
    transactions: Transaction[]
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>
  },
): Promise<void>
{
  const valor = parseBillAmountFromTitle(tarefa.titulo)
  if (valor <= 0 && !billCanonicalKey(tarefa)) return

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
