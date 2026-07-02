import type {
  CashAccountSettings,
  ContaFixa,
  FinanceBillSettlement,
  ReservedBill,
  Transaction,
} from '../store/storeTypes'
import { summarizeLedger, type LedgerSummary } from './financeLedger'
import { contaFixaEfetivamenteAtiva } from './financeContaFixa'
import { isContaFixaSatisfiedThisMonth } from './financeRecurringPost'
import type { CashBalanceOverrides } from '../store/storeTypes'

export interface ReservationSummary
{
  totalAlocado: number
  totalGasto: number
  totalReservado: number
  countAbertas: number
}

export interface CashPosition extends LedgerSummary
{
  saldoInicial: number
  saldoDisponivel: number
  saldoProjetadoDisponivel: number
  reservaRestante: number
  /** Contas fixas do mês ainda não lançadas — já descontadas do projetado */
  compromissosFixas: number
}

export interface CashPositionOptions
{
  contasFixas?: ContaFixa[]
  billSettlements?: FinanceBillSettlement[]
  reference?: Date
  overrides?: CashBalanceOverrides | null
}

export function summarizeReservations(bills: ReservedBill[]): ReservationSummary
{
  const abertas = bills.filter((b) => b.status === 'aberta')
  let totalAlocado = 0
  let totalGasto = 0
  let totalReservado = 0

  for (const b of abertas)
  {
    totalAlocado += b.valor_alocado
    totalGasto += b.valor_gasto
    totalReservado += Math.max(0, b.valor_alocado - b.valor_gasto)
  }

  return {
    totalAlocado,
    totalGasto,
    totalReservado,
    countAbertas: abertas.length,
  }
}

function sumUnpostedContasFixas(
  contasFixas: ContaFixa[],
  transactions: Transaction[],
  settlements: FinanceBillSettlement[],
  reference: Date,
): number
{
  let total = 0

  for (const conta of contasFixas)
  {
    if (!contaFixaEfetivamenteAtiva(conta, reference)) continue
    if (isContaFixaSatisfiedThisMonth(conta, transactions, settlements, reference)) continue
    total += conta.valor
  }

  return total
}

function applyManualOverrides(
  base: CashPosition,
  overrides?: CashBalanceOverrides | null,
): CashPosition
{
  if (!overrides?.ativo) return base

  return {
    ...base,
    saldoCorrente: overrides.corrente,
    reservaRestante: overrides.reservado,
    saldoDisponivel: overrides.disponivel,
    saldoProjetadoDisponivel: overrides.projetado,
  }
}

export function computeCashPosition(
  transactions: Transaction[],
  saldoInicial: number,
  bills: ReservedBill[],
  options?: CashPositionOptions,
): CashPosition
{
  const reference = options?.reference ?? new Date()
  const ledger = summarizeLedger(transactions, saldoInicial)
  const res = summarizeReservations(bills)
  const compromissosFixas = sumUnpostedContasFixas(
    options?.contasFixas ?? [],
    transactions,
    options?.billSettlements ?? [],
    reference,
  )

  const base: CashPosition = {
    ...ledger,
    saldoInicial,
    reservaRestante: res.totalReservado,
    saldoDisponivel: ledger.saldoCorrente - res.totalReservado,
    compromissosFixas,
    saldoProjetadoDisponivel: ledger.saldoProjetado - res.totalReservado - compromissosFixas,
  }

  return applyManualOverrides(base, options?.overrides)
}

/** Posição de caixa com overrides e fixas já resolvidas */
export function resolveCashPosition(params: {
  transactions: Transaction[]
  cashAccount: CashAccountSettings
  reservedBills: ReservedBill[]
  contasFixas?: ContaFixa[]
  billSettlements?: FinanceBillSettlement[]
  reference?: Date
}): CashPosition
{
  return computeCashPosition(
    params.transactions,
    params.cashAccount.saldo_inicial,
    params.reservedBills,
    {
      contasFixas: params.contasFixas,
      billSettlements: params.billSettlements,
      reference: params.reference,
      overrides: params.cashAccount.saldos_manual,
    },
  )
}

export function billProgress(bill: ReservedBill): number
{
  if (bill.valor_alocado <= 0) return 0
  return Math.min(100, (bill.valor_gasto / bill.valor_alocado) * 100)
}

export function billRemaining(bill: ReservedBill): number
{
  return Math.max(0, bill.valor_alocado - bill.valor_gasto)
}

/** Quanto de um lançamento pode abater na fatura */
export function applySpendToBill(bill: ReservedBill, valor: number): number
{
  const room = billRemaining(bill)
  return Math.min(valor, room)
}

export function nextBillStatus(bill: ReservedBill, valorGasto: number): ReservedBill['status']
{
  if (bill.status === 'cancelada') return 'cancelada'
  if (valorGasto >= bill.valor_alocado) return 'quitada'
  return 'aberta'
}
