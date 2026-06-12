import type {
  ContaFixa,
  FinancialGoal,
  RecurringIncome,
  Transaction,
} from '../store/storeTypes'

export interface GoalProjection
{
  remaining: number
  monthlySavings: number
  monthsToTarget: number | null
  projectedLabel: string | null
  onTrack: boolean
  paceMessage: string
}

const MONTHS_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
]

/** Estima quanto sobra por mês para destinar a metas */
export function estimateMonthlySavings(
  transactions: Transaction[],
  recurringIncomes: RecurringIncome[],
  contasFixas: ContaFixa[],
): number
{
  const rec = recurringIncomes
    .filter((r) => r.ativa)
    .reduce((s, r) => s + r.valor, 0)

  const fix = contasFixas
    .filter((c) => c.ativa)
    .reduce((s, c) => s + c.valor, 0)

  if (rec > 0)
  {
    return Math.max(0, rec - fix)
  }

  const byMonth = new Map<string, { receita: number; despesa: number }>()

  for (const t of transactions)
  {
    const key = t.data.slice(0, 7)
    const row = byMonth.get(key) ?? { receita: 0, despesa: 0 }
    if (t.tipo === 'receita') row.receita += t.valor
    else row.despesa += t.valor
    byMonth.set(key, row)
  }

  const nets = Array.from(byMonth.values())
    .map((v) => v.receita - v.despesa)
    .slice(-3)

  if (nets.length === 0) return 0

  const avg = nets.reduce((s, v) => s + v, 0) / nets.length
  return Math.max(0, avg)
}

function monthsUntilDeadline(prazo: string, ref = new Date()): number | null
{
  const target = new Date(`${prazo.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null

  const diff = (target.getFullYear() - ref.getFullYear()) * 12
    + (target.getMonth() - ref.getMonth())

  if (diff < 0) return 0
  return diff + (target.getDate() >= ref.getDate() ? 0 : -1)
}

function addMonthsLabel(months: number, ref = new Date()): string
{
  const d = new Date(ref.getFullYear(), ref.getMonth() + months, 1)
  return `${MONTHS_PT[d.getMonth()]}/${d.getFullYear()}`
}

export function projectFinancialGoal(
  goal: FinancialGoal,
  monthlySavings: number,
  ref = new Date(),
): GoalProjection
{
  const remaining = Math.max(0, goal.valor_alvo - goal.valor_atual)

  if (goal.concluida || remaining <= 0)
  {
    return {
      remaining: 0,
      monthlySavings,
      monthsToTarget: 0,
      projectedLabel: null,
      onTrack: true,
      paceMessage: 'Meta alcançada — parabéns!',
    }
  }

  if (monthlySavings <= 0)
  {
    return {
      remaining,
      monthlySavings: 0,
      monthsToTarget: null,
      projectedLabel: null,
      onTrack: false,
      paceMessage: 'Sem sobra mensal detectada. Cadastre receitas recorrentes ou reduza gastos.',
    }
  }

  const monthsToTarget = Math.ceil(remaining / monthlySavings)
  const projectedLabel = addMonthsLabel(monthsToTarget, ref)

  let onTrack = true
  let paceMessage = `No ritmo atual (~${monthlySavings.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês), atinge em ${monthsToTarget} ${monthsToTarget === 1 ? 'mês' : 'meses'}.`

  if (goal.prazo)
  {
    const monthsLeft = monthsUntilDeadline(goal.prazo, ref)
    if (monthsLeft != null)
    {
      onTrack = monthsToTarget <= monthsLeft
      const prazoFmt = new Date(`${goal.prazo.slice(0, 10)}T12:00:00`)
        .toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })

      if (!onTrack)
      {
        paceMessage = `Prazo ${prazoFmt}: precisa de ~${(remaining / Math.max(monthsLeft, 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês para cumprir.`
      }
      else
      {
        paceMessage = `Dentro do prazo (${prazoFmt}) — projeção ${projectedLabel}.`
      }
    }
  }

  return {
    remaining,
    monthlySavings,
    monthsToTarget,
    projectedLabel,
    onTrack,
    paceMessage,
  }
}
