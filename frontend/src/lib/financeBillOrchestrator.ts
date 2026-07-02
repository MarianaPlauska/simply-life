import type { ContaFixa, ReservedBill, Transaction, VirtualCard, FinanceBillSettlement } from '../store/storeTypes'
import type { TarefaUnificada } from '../types'
import { billReferenceKeyFromTitle, billTaskReferenceKey } from './financeBillTaskDedup'
import { dismissBill, isBillDismissed } from './financeBillDismiss'
import { buildUpcomingBills } from './financeUpcomingBills'
import { isPaidInSettlements } from './financeLedgerReconcile'
import { hasPaidExpenseForBill } from './financeBillPayment'

export interface UpcomingBill
{
  id: string
  tipo: 'conta_fixa' | 'reserva' | 'cartao' | 'pendente' | 'agendado'
  nome: string
  valor: number
  vencimento: string
  diasRestantes: number
  urgente: boolean
}

export interface GetUpcomingBillsInput
{
  contasFixas: ContaFixa[]
  reservedBills: ReservedBill[]
  cards?: VirtualCard[]
  transactions?: Transaction[]
  settlements?: FinanceBillSettlement[]
  windowDays?: number
  reference?: Date
}

/** Fonte única — delega para buildUpcomingBills (fixas, reservas, cartões, pendentes) */
export function getUpcomingBills(input: GetUpcomingBillsInput): UpcomingBill[]
{
  const windowDays = input.windowDays ?? 7
  const ref = input.reference ?? new Date()

  const full = buildUpcomingBills({
    contasFixas: input.contasFixas,
    reservedBills: input.reservedBills,
    cards: input.cards ?? [],
    transactions: input.transactions ?? [],
    settlements: input.settlements ?? [],
    horizonDays: windowDays,
    reference: ref,
  })

  return full.map((b) =>
  {
    const tipo = b.kind === 'fatura_reserva'
      ? 'reserva'
      : b.kind === 'conta_fixa'
        ? 'conta_fixa'
        : b.kind === 'cartao_fatura'
          ? 'cartao'
          : b.kind === 'agendado'
            ? 'agendado'
            : 'pendente'

    return {
      id: b.id,
      tipo,
      nome: b.label,
      valor: b.valor,
      vencimento: b.dueDate,
      diasRestantes: b.daysUntil,
      urgente: b.daysUntil <= 2,
    }
  })
}

export function billPhantomKey(billId: string): string
{
  return `phantom_fin_bill_${billId}`
}

export function billTaskTitle(bill: UpcomingBill): string
{
  const valor = bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `[Boleto] ${bill.nome} — ${valor}`
}

export function billTaskNotes(bill: UpcomingBill): string
{
  if (bill.diasRestantes === 0)
  {
    return `Vence hoje (${bill.vencimento}). Ref: ${bill.id}. Criado pelo AXEL Finanças.`
  }
  if (bill.diasRestantes === 1)
  {
    return `Vence amanhã (${bill.vencimento}). Ref: ${bill.id}. Criado pelo AXEL Finanças.`
  }
  return `Vence em ${bill.vencimento} (${bill.diasRestantes}d). Ref: ${bill.id}. Criado pelo AXEL Finanças.`
}

/** Entra no Kanban no dia do vencimento ou 1 dia antes, no mês corrente */
export function isBillKanbanEligible(bill: UpcomingBill, reference = new Date()): boolean
{
  if (bill.diasRestantes !== 0 && bill.diasRestantes !== 1) return false

  const due = new Date(`${bill.vencimento}T12:00:00`)
  if (Number.isNaN(due.getTime())) return false

  return due.getMonth() === reference.getMonth()
    && due.getFullYear() === reference.getFullYear()
}

export function taskMatchesBill(
  titulo: string,
  bill: UpcomingBill,
  snippet?: string | null,
  notas?: string | null,
): boolean
{
  if (snippet === billPhantomKey(bill.id)) return true
  if (notas?.includes(bill.id)) return true

  const t = titulo.toLowerCase()
  if (!t.includes('[boleto]') && !t.includes('boleto')) return false

  const billKey = billReferenceKeyFromTitle(billTaskTitle(bill))
  const taskKey = billReferenceKeyFromTitle(titulo)
  if (billKey && taskKey && billKey === taskKey) return true

  const nome = bill.nome.replace(/\s*\[fixa:\d+\]/gi, '').trim().toLowerCase()
  const valor = bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).toLowerCase()
  return t.includes(nome) && t.includes(valor.replace(/\s/g, ''))
}

/** ID do boleto/conta a partir da tarefa financeira */
export function billIdFromTask(tarefa: TarefaUnificada): string | null
{
  const phantom = tarefa.snippet_100_char?.match(/^phantom_fin_bill_(.+)$/)
  if (phantom?.[1]) return phantom[1]

  const ref = tarefa.notas_locais?.match(/Ref:\s*([^\s.]+)/i)
  if (ref?.[1]) return ref[1]

  return null
}

/** Marca o ciclo mensal como resolvido — impede recriar tarefa no refresh */
export function dismissBillForTask(tarefa: TarefaUnificada, ref = new Date()): void
{
  const billId = billIdFromTask(tarefa)
  if (billId)
  {
    dismissBill(billId, ref)
    return
  }

  const refKey = billTaskReferenceKey(tarefa)
  if (refKey)
  {
    dismissBill(`ref:${refKey}`, ref)
  }
}

function taskCoversBillPeriod(tarefa: TarefaUnificada, bill: UpcomingBill): boolean
{
  if (tarefa.status !== 'concluida') return false

  const taskBillId = billIdFromTask(tarefa)
  if (taskBillId === bill.id) return true

  const refKey = billReferenceKeyFromTitle(billTaskTitle(bill))
  if (refKey && billTaskReferenceKey(tarefa) === refKey) return true

  const nome = bill.nome.replace(/\s*\[fixa:\d+\]/gi, '').trim().toLowerCase()
  const titulo = tarefa.titulo.toLowerCase()
  if (nome.length >= 3 && titulo.includes(nome))
  {
    if (tarefa.data_vencimento && bill.vencimento)
    {
      return tarefa.data_vencimento.slice(0, 7) === bill.vencimento.slice(0, 7)
    }
    return true
  }

  if (tarefa.data_vencimento && bill.vencimento)
  {
    return tarefa.data_vencimento.slice(0, 7) === bill.vencimento.slice(0, 7)
  }

  return false
}

/** Boleto já pago/resolvido neste ciclo — não criar tarefa de novo */
export function isBillResolvedForPeriod(
  bill: UpcomingBill,
  tarefas: TarefaUnificada[],
  ref = new Date(),
  options?: {
    settlements?: FinanceBillSettlement[]
    transactions?: Transaction[]
  },
): boolean
{
  if (isBillDismissed(bill.id, ref)) return true

  const refKey = billReferenceKeyFromTitle(billTaskTitle(bill))
  if (refKey && isBillDismissed(`ref:${refKey}`, ref)) return true

  const settlements = options?.settlements ?? []
  const transactions = options?.transactions ?? []
  const monthKey = bill.vencimento.slice(0, 7)

  if (settlements.length > 0)
  {
    const titulo = billTaskTitle(bill)
    if (isPaidInSettlements(titulo, bill.valor, settlements)) return true
    if (isPaidInSettlements(bill.nome, bill.valor, settlements)) return true
  }

  if (transactions.length > 0)
  {
    const titulo = billTaskTitle(bill)
    if (hasPaidExpenseForBill(transactions, titulo, bill.valor, monthKey)) return true
    if (hasPaidExpenseForBill(transactions, bill.nome, bill.valor, monthKey)) return true
  }

  return tarefas.some((t) => taskCoversBillPeriod(t, bill))
}
