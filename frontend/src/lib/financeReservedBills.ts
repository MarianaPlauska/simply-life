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
import { isPaidInSettlements } from './financeLedgerReconcile'
import { hasPaidCashExpenseForBill } from './financeBillPayment'

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
  /** Contas fixas do mês ainda não lançadas - já descontadas do projetado */
  compromissosFixas: number
}

export interface CashPositionOptions
{
  contasFixas?: ContaFixa[]
  billSettlements?: FinanceBillSettlement[]
  transactions?: Transaction[]
  reference?: Date
  overrides?: CashBalanceOverrides | null
}

export interface ReservationOptions
{
  settlements?: FinanceBillSettlement[]
  transactions?: Transaction[]
}

/** Reserva efetiva - ignora boletos já pagos (Pagos) ou com despesa no extrato */
export function effectiveReservedForBill(
  bill: ReservedBill,
  settlements: FinanceBillSettlement[] = [],
  transactions: Transaction[] = [],
): number
{
  if (bill.status !== 'aberta') return 0

  const remaining = Math.max(0, bill.valor_alocado - bill.valor_gasto)
  if (remaining <= 0) return 0

  if (isPaidInSettlements(bill.titulo, bill.valor_alocado, settlements)) return 0
  if (hasPaidCashExpenseForBill(transactions, bill.titulo, bill.valor_alocado)) return 0
  if (hasPaidCashExpenseForBill(transactions, bill.titulo, remaining)) return 0

  return remaining
}

/** Pagamentos em Pagos sem lançamento no caixa - só desconta do mês corrente */
function sumSettlementCashGaps(
  settlements: FinanceBillSettlement[],
  transactions: Transaction[],
  reference: Date,
): number
{
  const monthKey = `${reference.getFullYear()}-${String(reference.getMonth() + 1).padStart(2, '0')}`
  let gap = 0

  for (const s of settlements)
  {
    if (!s.pago_em.startsWith(monthKey)) continue
    if (hasPaidCashExpenseForBill(transactions, s.titulo, s.valor)) continue
    gap += s.valor
  }

  return gap
}

export function summarizeReservations(
  bills: ReservedBill[],
  options?: ReservationOptions,
): ReservationSummary
{
  const settlements = options?.settlements ?? []
  const transactions = options?.transactions ?? []
  const abertas = bills.filter((b) => b.status === 'aberta')
  let totalAlocado = 0
  let totalGasto = 0
  let totalReservado = 0

  for (const b of abertas)
  {
    totalAlocado += b.valor_alocado
    totalGasto += b.valor_gasto
    totalReservado += effectiveReservedForBill(b, settlements, transactions)
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
  const settlements = options?.billSettlements ?? []
  const ledger = summarizeLedger(transactions, saldoInicial)
  const settlementGap = sumSettlementCashGaps(settlements, transactions, reference)
  const saldoCorrenteAjustado = ledger.saldoCorrente - settlementGap
  const res = summarizeReservations(bills, {
    settlements,
    transactions,
  })
  const compromissosFixas = sumUnpostedContasFixas(
    options?.contasFixas ?? [],
    transactions,
    settlements,
    reference,
  )

  const base: CashPosition = {
    ...ledger,
    saldoCorrente: saldoCorrenteAjustado,
    saldoInicial,
    reservaRestante: res.totalReservado,
    saldoDisponivel: saldoCorrenteAjustado - res.totalReservado,
    compromissosFixas,
    saldoProjetadoDisponivel: ledger.saldoProjetado - settlementGap - res.totalReservado - compromissosFixas,
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
