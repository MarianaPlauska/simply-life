import { buildUpcomingBills } from './financeUpcomingBills'
import { computeCashPosition } from './financeReservedBills'
import { daysUntilMonthEnd } from './financeSpendAdvice'
import { buildCategoryBudgetRows } from './financeCategoryBudget'
import type {
  BudgetLimit,
  Category,
  ContaFixa,
  ReservedBill,
  Transaction,
  VirtualCard,
} from '../store/storeTypes'

export interface FinanceDailyBrief
{
  headline: string
  detail: string
  saldoDisponivel: number
  contasProximas: number
  proximasValor: number
  categoriasEmAlerta: string[]
  diasRestantes: number
  /** Contas com vencimento hoje + categorias em alerta (≥80%) */
  hojeLines: string[]
  contasHoje: number
}

export function buildFinanceDailyBrief(input: {
  transactions: Transaction[]
  saldoInicial: number
  reservedBills: ReservedBill[]
  contasFixas: ContaFixa[]
  cards: VirtualCard[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  ref?: Date
}): FinanceDailyBrief
{
  const ref = input.ref ?? new Date()
  const position = computeCashPosition(
    input.transactions,
    input.saldoInicial,
    input.reservedBills,
  )

  const upcoming = buildUpcomingBills({
    contasFixas: input.contasFixas,
    cards: input.cards,
    transactions: input.transactions,
    reservedBills: input.reservedBills,
    horizonDays: 7,
    reference: ref,
  }).filter((b) => b.daysUntil <= 3)

  const dueToday = upcoming.filter((b) => b.daysUntil === 0)

  const monthKey = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`
  const monthTx = input.transactions.filter((t) => t.data.startsWith(monthKey))

  const budgetRows = buildCategoryBudgetRows(
    input.categories,
    input.budgetLimits,
    monthTx,
  )

  const alertRows = budgetRows
    .filter((r) => r.limite > 0 && r.pct >= 80)
    .slice(0, 3)

  const categoriasEmAlerta = alertRows.map((r) => r.nome)

  const hojeLines: string[] = []
  for (const b of dueToday.slice(0, 3))
  {
    hojeLines.push(`Vence hoje: ${b.label} (${fmt(b.valor)})`)
  }
  for (const r of alertRows)
  {
    hojeLines.push(
      r.pct >= 100
        ? `${r.nome} estourou o orçamento (${r.pct.toFixed(0)}%)`
        : `${r.nome} em ${r.pct.toFixed(0)}% do limite`,
    )
  }

  const diasRestantes = daysUntilMonthEnd(ref)
  const proximasValor = upcoming.reduce((s, b) => s + b.valor, 0)

  let headline = `Livre: ${fmt(position.saldoDisponivel)}`
  const parts: string[] = []

  if (dueToday.length > 0)
  {
    parts.push(`${dueToday.length} conta(s) vencem hoje`)
  }
  else if (upcoming.length > 0)
  {
    parts.push(`${upcoming.length} conta(s) em até 3 dias (${fmt(proximasValor)})`)
  }

  if (categoriasEmAlerta.length > 0)
  {
    parts.push(`${categoriasEmAlerta.join(', ')} perto do limite`)
  }

  if (position.saldoDisponivel < 0)
  {
    headline = 'Caixa negativo - priorize essenciais'
  }
  else if (dueToday.length > 0)
  {
    headline = 'Hoje: contas e limites pedem atenção'
  }
  else if (diasRestantes <= 5 && position.saldoProjetadoDisponivel < position.saldoDisponivel * 0.4)
  {
    headline = 'Fim de mês apertado - segure variáveis'
  }

  const detail = parts.length > 0
    ? parts.join(' · ')
    : `${diasRestantes} dias no mês - ritmo tranquilo por enquanto.`

  return {
    headline,
    detail,
    saldoDisponivel: position.saldoDisponivel,
    contasProximas: upcoming.length,
    proximasValor,
    categoriasEmAlerta,
    diasRestantes,
    hojeLines,
    contasHoje: dueToday.length,
  }
}

function fmt(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
