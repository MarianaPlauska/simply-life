/**
 * Regra de orçamento por faixas (50/30/20 e variações), sobre os gastos reais
 * do mês: cada categoria pertence a uma faixa (necessidade, desejo ou reserva).
 * Origem da 50/30/20: Elizabeth Warren e Amelia Tyagi, "All Your Worth" (2005).
 */
import type { FinanceTx } from './finance'
import { isFaturaSettlement, txsInCalendarMonth } from './financeCash'

export type BudgetBucket = 'needs' | 'wants' | 'savings'

export const BUDGET_BUCKET_LABEL: Record<BudgetBucket, string> = {
  needs: 'Necessidades',
  wants: 'Desejos',
  savings: 'Reserva',
}

export const BUDGET_BUCKET_HINT: Record<BudgetBucket, string> = {
  needs: 'O que não dá para cortar: moradia, contas, saúde, transporte, mercado.',
  wants: 'O que escolhe ter: lazer, compras, comer fora.',
  savings: 'O que sobra ou guarda: reserva, investimento, metas.',
}

export type BudgetRule = { needs: number; wants: number; savings: number }

export const BUDGET_PRESETS: { id: string; rule: BudgetRule; hint: string }[] = [
  { id: '50/30/20', rule: { needs: 50, wants: 30, savings: 20 }, hint: 'A regra clássica.' },
  { id: '60/30/10', rule: { needs: 60, wants: 30, savings: 10 }, hint: 'Quando as contas fixas pesam mais.' },
  { id: '70/20/10', rule: { needs: 70, wants: 20, savings: 10 }, hint: 'Aluguel alto ou renda mais apertada.' },
]

export const DEFAULT_BUDGET_RULE: BudgetRule = BUDGET_PRESETS[0].rule

/** Faixa padrão das categorias do app. */
const BUILTIN_BUCKET: Record<string, BudgetBucket> = {
  habitacao: 'needs',
  saude: 'needs',
  transporte: 'needs',
  educacao: 'needs',
  alimentacao: 'needs',
  lazer: 'wants',
  compras: 'wants',
  outros: 'wants',
}

/** Faixa padrão de uma categoria, inclusive as criadas pela pessoa (pelo nome). */
export function defaultBucketFor(id: string, label = ''): BudgetBucket
{
  if (BUILTIN_BUCKET[id]) return BUILTIN_BUCKET[id]
  const text = `${id} ${label}`.toLowerCase()
  if (/invest|reserva|poupan|previd|guardar/.test(text)) return 'savings'
  if (/moradia|aluguel|condom|conta|luz|energia|agua|água|internet|telefone|celular|saude|saúde|farm|remed|plano|transp|combust|gasolina|onibus|ônibus|mercado|feira|escola|educa|curso|creche|seguro|imposto/.test(text)) return 'needs'
  return 'wants'
}

export function bucketOf(id: string, overrides: Record<string, BudgetBucket> | undefined, label = ''): BudgetBucket
{
  return overrides?.[id] ?? defaultBucketFor(id, label)
}

/** Normaliza percentuais para somarem 100 (a reserva absorve o arredondamento). */
export function normalizeBudgetRule(raw: Partial<BudgetRule> | null | undefined): BudgetRule
{
  const needs = Math.min(100, Math.max(0, Math.round(raw?.needs ?? DEFAULT_BUDGET_RULE.needs)))
  const wants = Math.min(100 - needs, Math.max(0, Math.round(raw?.wants ?? DEFAULT_BUDGET_RULE.wants)))
  return { needs, wants, savings: 100 - needs - wants }
}

export function budgetRuleLabel(rule: BudgetRule): string
{
  return `${rule.needs}/${rule.wants}/${rule.savings}`
}

export type BudgetRow = {
  bucket: BudgetBucket
  pct: number
  /** quanto a regra reserva para a faixa neste mês */
  budget: number
  /** quanto já foi para a faixa */
  used: number
  categories: { id: string; total: number }[]
}

export type BudgetSplit = {
  income: number
  spent: number
  hasIncome: boolean
  rows: BudgetRow[]
}

/**
 * Divide o mês pelas faixas. Necessidades e desejos: gastos das categorias da faixa.
 * Reserva: o que foi para categorias de reserva mais o que sobrou da receita.
 * Pagamento de fatura não entra (as compras do cartão já contam uma vez).
 */
export function budgetSplit(input: {
  txs: FinanceTx[]
  rule?: BudgetRule
  overrides?: Record<string, BudgetBucket>
  labels?: Record<string, string>
  ref?: Date
}): BudgetSplit
{
  const rule = normalizeBudgetRule(input.rule)
  const month = txsInCalendarMonth(input.txs, input.ref)
  const income = month.filter((t) => t.tipo === 'receita').reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const expenses = month.filter((t) => t.tipo === 'despesa' && !isFaturaSettlement(t))
  const byCat = new Map<string, number>()
  for (const t of expenses) byCat.set(t.categoria, (byCat.get(t.categoria) ?? 0) + (Number(t.valor) || 0))
  const spent = [...byCat.values()].reduce((a, b) => a + b, 0)

  const rows: BudgetRow[] = (['needs', 'wants', 'savings'] as BudgetBucket[]).map((bucket) =>
  {
    const categories = [...byCat.entries()]
      .filter(([id]) => bucketOf(id, input.overrides, input.labels?.[id]) === bucket)
      .map(([id, total]) => ({ id, total }))
      .sort((a, b) => b.total - a.total)
    let used = categories.reduce((a, c) => a + c.total, 0)
    if (bucket === 'savings') used += Math.max(0, income - spent)
    return { bucket, pct: rule[bucket], budget: (income * rule[bucket]) / 100, used, categories }
  })

  return { income, spent, hasIncome: income > 0, rows }
}

/* ------------------------------------------------------------------ */
/* Saldo em dias de folga                                             */
/* ------------------------------------------------------------------ */

export type BalanceTone = 'sem_dados' | 'tranquilo' | 'atencao' | 'apertado' | 'negativo'

export const BALANCE_TONE_LABEL: Record<BalanceTone, string> = {
  sem_dados: 'Sem dados ainda',
  tranquilo: 'Tranquilo',
  atencao: 'Pede atenção',
  apertado: 'Apertado',
  negativo: 'No negativo',
}

/**
 * Quantos dias o saldo aguenta no ritmo do mês: contas fixas ativas mais o gasto
 * médio do dia a dia (débito, pix, dinheiro). Medido em dias, não em reais, porque
 * R$ 500 é folga para uma pessoa e não paga o aluguel de outra.
 */
export function balanceRunway(input: {
  disponivel: number
  saldoInicial: number
  txs: FinanceTx[]
  fixasMes: number
  ref?: Date
}): { days: number | null; dailyNeed: number; tone: BalanceTone }
{
  const ref = input.ref ?? new Date()
  const month = txsInCalendarMonth(input.txs, ref)
  const cashSpent = month
    .filter((t) => t.tipo === 'despesa' && !t.cardId && !isFaturaSettlement(t))
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const dayOfMonth = Math.max(1, ref.getDate())
  const dailyNeed = cashSpent / dayOfMonth + input.fixasMes / 30
  const noData = input.saldoInicial === 0 && month.length === 0
  if (noData) return { days: null, dailyNeed: 0, tone: 'sem_dados' }
  if (input.disponivel < 0) return { days: 0, dailyNeed, tone: 'negativo' }
  if (dailyNeed <= 0) return { days: null, dailyNeed: 0, tone: 'tranquilo' }
  const days = Math.floor(input.disponivel / dailyNeed)
  return { days, dailyNeed, tone: days >= 20 ? 'tranquilo' : days >= 7 ? 'atencao' : 'apertado' }
}
