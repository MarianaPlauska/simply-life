import type { ContaFixa, ReservedBill, Transaction, VirtualCard } from '../store/storeTypes'
import { buildUpcomingBills } from './financeUpcomingBills'

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
  const nome = bill.nome.toLowerCase()
  if (!t.includes('[boleto]') && !t.includes('boleto')) return false

  return t.includes(nome)
}
