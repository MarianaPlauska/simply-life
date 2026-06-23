import {
  buildCategoryBudgetRows,
  type CategoryBudgetRow,
} from './financeCategoryBudget'
import { daysUntilDue, resolveBillVisualStatus } from './financeBillVisual'
import { contaFixaEfetivamenteAtiva } from './financeContaFixa'
import { estimateMonthlySavings, projectFinancialGoal } from './financeGoalProjection'
import type {
  BudgetLimit,
  Category,
  ContaFixa,
  FinancialGoal,
  RecurringIncome,
  ReservedBill,
  ReservedBillItem,
  Transaction,
  VirtualCard,
} from '../store/storeTypes'

export type FinanceAlertSeverity = 'info' | 'caution' | 'urgent'

export type FinanceAlertTab =
  | 'metas'
  | 'faturas'
  | 'contas-fixas'
  | 'cartoes'
  | 'visao-geral'
  | 'tabela'

export interface FinanceAlert
{
  id: string
  severity: FinanceAlertSeverity
  title: string
  message: string
  source: 'orcamento' | 'fatura' | 'fixa' | 'cartao' | 'meta'
  actionTab?: FinanceAlertTab
}

export interface FinanceAlertsInput
{
  transactions: Transaction[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  reservedBills: ReservedBill[]
  reservedBillItems: ReservedBillItem[]
  contasFixas: ContaFixa[]
  cards: VirtualCard[]
  financialGoals: FinancialGoal[]
  recurringIncomes: RecurringIncome[]
  monthTransactions?: Transaction[]
}

function daysUntilMonthDay(dia: number, ref = new Date()): number
{
  const today = ref.getDate()
  const dim = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  let diff = dia - today
  if (diff < 0) diff += dim
  return diff
}

function severityWeight(s: FinanceAlertSeverity): number
{
  if (s === 'urgent') return 0
  if (s === 'caution') return 1
  return 2
}

function budgetAlerts(
  rows: CategoryBudgetRow[],
): FinanceAlert[]
{
  const out: FinanceAlert[] = []

  for (const row of rows)
  {
    if (row.alert === 'over')
    {
      out.push({
        id: `budget-over-${row.id}`,
        severity: 'urgent',
        title: `Orçamento estourado · ${row.nome}`,
        message: `${row.pct.toFixed(0)}% do limite (R$ ${row.gasto.toFixed(2)} de R$ ${row.limite.toFixed(2)}).`,
        source: 'orcamento',
        actionTab: 'visao-geral',
      })
    }
    else if (row.alert === 'caution')
    {
      out.push({
        id: `budget-warn-${row.id}`,
        severity: 'caution',
        title: `Orçamento em alerta · ${row.nome}`,
        message: `${row.pct.toFixed(0)}% do limite mensal.`,
        source: 'orcamento',
        actionTab: 'visao-geral',
      })
    }
  }

  return out
}

function billAlerts(
  bills: ReservedBill[],
  items: ReservedBillItem[],
): FinanceAlert[]
{
  const out: FinanceAlert[] = []

  for (const bill of bills)
  {
    if (bill.status !== 'aberta') continue

    const billItems = items.filter((i) => i.fatura_reserva_id === bill.id)
    const status = resolveBillVisualStatus(bill, billItems)
    const days = daysUntilDue(bill.data_vencimento)

    if (status === 'urgente')
    {
      out.push({
        id: `bill-urgent-${bill.id}`,
        severity: 'urgent',
        title: `Fatura urgente · ${bill.titulo}`,
        message: days < 0
          ? `Venceu há ${Math.abs(days)} dia(s).`
          : days === 0
            ? 'Vence hoje.'
            : `Vence em ${days} dia(s).`,
        source: 'fatura',
        actionTab: 'faturas',
      })
    }
    else if (status === 'vencendo' || status === 'consumindo')
    {
      out.push({
        id: `bill-warn-${bill.id}`,
        severity: 'caution',
        title: status === 'consumindo'
          ? `Fatura quase esgotada · ${bill.titulo}`
          : `Fatura vencendo · ${bill.titulo}`,
        message: `Alocado R$ ${bill.valor_alocado.toFixed(2)} · gasto R$ ${bill.valor_gasto.toFixed(2)}.`,
        source: 'fatura',
        actionTab: 'faturas',
      })
    }
  }

  return out
}

function fixedBillAlerts(contas: ContaFixa[]): FinanceAlert[]
{
  const out: FinanceAlert[] = []

  for (const conta of contas)
  {
    if (!contaFixaEfetivamenteAtiva(conta)) continue

    const days = daysUntilMonthDay(conta.dia_vencimento)
    if (days > 5) continue

    out.push({
      id: `fixa-${conta.id}`,
      severity: days <= 2 ? 'urgent' : 'caution',
      title: `Conta fixa · ${conta.nome}`,
      message: days === 0
        ? `Vence hoje — R$ ${conta.valor.toFixed(2)}.`
        : `Vence em ${days} dia(s) — R$ ${conta.valor.toFixed(2)}.`,
      source: 'fixa',
      actionTab: 'contas-fixas',
    })
  }

  return out
}

function cardAlerts(cards: VirtualCard[]): FinanceAlert[]
{
  const out: FinanceAlert[] = []

  for (const card of cards)
  {
    if (card.status !== 'ativo' || !card.dia_vencimento) continue

    const days = daysUntilMonthDay(card.dia_vencimento)
    if (days > 3) continue

    out.push({
      id: `card-${card.id}`,
      severity: days <= 1 ? 'urgent' : 'caution',
      title: `Fatura do cartão · ${card.nome}`,
      message: days === 0 ? 'Vencimento hoje.' : `Vencimento em ${days} dia(s).`,
      source: 'cartao',
      actionTab: 'cartoes',
    })
  }

  return out
}

function goalAlerts(
  goals: FinancialGoal[],
  monthlySavings: number,
): FinanceAlert[]
{
  const out: FinanceAlert[] = []

  for (const goal of goals)
  {
    if (goal.concluida) continue

    const projection = projectFinancialGoal(goal, monthlySavings)

    if (!projection.onTrack && goal.prazo)
    {
      out.push({
        id: `goal-behind-${goal.id}`,
        severity: 'caution',
        title: `Meta atrasada · ${goal.titulo}`,
        message: projection.paceMessage,
        source: 'meta',
        actionTab: 'metas',
      })
    }
    else if (projection.monthsToTarget != null && projection.monthsToTarget <= 1 && projection.remaining > 0)
    {
      out.push({
        id: `goal-close-${goal.id}`,
        severity: 'info',
        title: `Meta quase lá · ${goal.titulo}`,
        message: `Faltam R$ ${projection.remaining.toFixed(2)} para concluir.`,
        source: 'meta',
        actionTab: 'metas',
      })
    }
  }

  return out
}

export function buildFinanceAlerts(input: FinanceAlertsInput): FinanceAlert[]
{
  const monthTx = input.monthTransactions ?? input.transactions.filter((t) =>
  {
    const now = new Date()
    const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const budgetRows = buildCategoryBudgetRows(
    input.categories,
    input.budgetLimits,
    monthTx,
  )

  const monthlySavings = estimateMonthlySavings(
    input.transactions,
    input.recurringIncomes,
    input.contasFixas,
  )

  const alerts = [
    ...budgetAlerts(budgetRows),
    ...billAlerts(input.reservedBills, input.reservedBillItems),
    ...fixedBillAlerts(input.contasFixas),
    ...cardAlerts(input.cards),
    ...goalAlerts(input.financialGoals, monthlySavings),
  ]

  return alerts.sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity))
}
