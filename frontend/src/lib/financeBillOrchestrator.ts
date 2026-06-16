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

export function billTaskTitle(bill: UpcomingBill): string
{
  const valor = bill.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `[Boleto] ${bill.nome} — ${valor}`
}

export function billTaskNotes(bill: UpcomingBill): string
{
  return `Vence em ${bill.vencimento} (${bill.diasRestantes}d). Criado pelo AXEL Finanças.`
}

export function taskMatchesBill(titulo: string, bill: UpcomingBill): boolean
{
  const t = titulo.toLowerCase()
  return t.includes('[boleto]') && t.includes(bill.id)
}
