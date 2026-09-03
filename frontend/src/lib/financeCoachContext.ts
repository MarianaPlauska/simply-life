import { buildCategoryBudgetRows } from './financeCategoryBudget'
import { adviseSpend, daysUntilMonthEnd } from './financeSpendAdvice'
import { computeCashPosition } from './financeReservedBills'
import type {
  BudgetLimit,
  Category,
  ReservedBill,
  Transaction,
} from '../store/storeTypes'

export interface CategorySpendInsight
{
  categoriaId: number
  nome: string
  gastoMes: number
  media3Meses: number
  temLimite: boolean
  limiteAtual: number
  pctLimite: number
  acimaDaMedia: boolean
}

export interface LimitSuggestion
{
  categoriaId: number
  categoriaNome: string
  valorSugerido: number
  motivo: string
}

export interface FinanceCoachAdvice
{
  tone: 'ok' | 'caution' | 'urgent'
  headline: string
  detail: string
  limiteDiarioSugerido: number | null
  limitSuggestions: LimitSuggestion[]
  source: 'local' | 'groq'
}

export interface FinanceCoachContext
{
  monthLabel: string
  diasRestantes: number
  saldoDisponivel: number
  saldoProjetado: number
  folga: number
  receitaMes: number
  despesaMes: number
  despesasPendentes: number
  categorias: CategorySpendInsight[]
  categoriasSemLimite: CategorySpendInsight[]
  categoriasEstouradas: CategorySpendInsight[]
  ritmoDiario: number
  ritmoDiarioSeguro: number | null
}

function isInMonth(isoDate: string, year: number, month: number): boolean
{
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`)
  return d.getFullYear() === year && d.getMonth() === month
}

/** Média de gasto por categoria nos últimos 3 meses (exclui mês atual) */
function categoryRollingAverage(
  transactions: Transaction[],
  categories: Category[],
  categoriaId: number,
  ref = new Date(),
): number
{
  const childIds = new Set(
    categories.filter((c) => c.parent_id === categoriaId).map((c) => c.id),
  )
  childIds.add(categoriaId)

  const totals: number[] = []

  for (let i = 1; i <= 3; i++)
  {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1)
    const spent = transactions
      .filter((t) =>
        t.tipo === 'despesa'
        && t.categoria_id != null
        && childIds.has(t.categoria_id)
        && isInMonth(t.data, d.getFullYear(), d.getMonth()),
      )
      .reduce((s, t) => s + t.valor, 0)
    totals.push(spent)
  }

  const nonzero = totals.filter((v) => v > 0)
  if (nonzero.length === 0) return 0
  return nonzero.reduce((a, b) => a + b, 0) / nonzero.length
}

export function buildFinanceCoachContext(input: {
  transactions: Transaction[]
  monthTransactions: Transaction[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  saldoInicial: number
  reservedBills: ReservedBill[]
  ref?: Date
}): FinanceCoachContext
{
  const ref = input.ref ?? new Date()
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  const position = computeCashPosition(
    input.transactions,
    input.saldoInicial,
    input.reservedBills,
  )

  const diasRestantes = daysUntilMonthEnd(ref)
  const folga = position.saldoProjetadoDisponivel - position.pendentes - position.agendados
  const receitaMes = input.monthTransactions
    .filter((t) => t.tipo === 'receita')
    .reduce((s, t) => s + t.valor, 0)
  const despesaMes = input.monthTransactions
    .filter((t) => t.tipo === 'despesa' || t.tipo === 'investimento')
    .reduce((s, t) => s + t.valor, 0)

  const budgetRows = buildCategoryBudgetRows(
    input.categories,
    input.budgetLimits,
    input.monthTransactions,
  )

  const categorias: CategorySpendInsight[] = budgetRows
    .filter((r) => r.gasto > 0 || r.limite > 0)
    .map((r) =>
    {
      const media3 = categoryRollingAverage(input.transactions, input.categories, r.id, ref)
      return {
        categoriaId: r.id,
        nome: r.nome,
        gastoMes: r.gasto,
        media3Meses: media3,
        temLimite: r.limite > 0,
        limiteAtual: r.limite,
        pctLimite: r.pct,
        acimaDaMedia: media3 > 0 && r.gasto > media3 * 1.15,
      }
    })
    .sort((a, b) => b.gastoMes - a.gastoMes)

  const diaAtual = ref.getDate()
  const ritmoDiario = diaAtual > 0 ? despesaMes / diaAtual : 0
  const ritmoDiarioSeguro = folga > 0 && diasRestantes > 0
    ? folga / diasRestantes
    : null

  return {
    monthLabel: `${monthNames[month]} ${year}`,
    diasRestantes,
    saldoDisponivel: position.saldoDisponivel,
    saldoProjetado: position.saldoProjetadoDisponivel,
    folga,
    receitaMes,
    despesaMes,
    despesasPendentes: position.pendentes + position.agendados,
    categorias,
    categoriasSemLimite: categorias.filter((c) => !c.temLimite && c.gastoMes >= 80),
    categoriasEstouradas: categorias.filter((c) => c.temLimite && c.pctLimite >= 100),
    ritmoDiario,
    ritmoDiarioSeguro,
  }
}

/** Conselho local - números reais do usuário, sem IA */
export function buildLocalFinanceCoachAdvice(
  ctx: FinanceCoachContext,
  transactions: Transaction[],
  saldoInicial: number,
  reservedBills: ReservedBill[],
): FinanceCoachAdvice
{
  const position = computeCashPosition(transactions, saldoInicial, reservedBills)
  const base = adviseSpend({
    saldoCorrente: position.saldoDisponivel,
    saldoProjetado: position.saldoProjetadoDisponivel,
    despesasPendentes: position.pendentes,
    despesasAgendadas: position.agendados,
    diasAteFimMes: ctx.diasRestantes,
  })

  const limitSuggestions: LimitSuggestion[] = []

  for (const cat of ctx.categoriasSemLimite.slice(0, 3))
  {
    const sugerido = cat.media3Meses > 0
      ? Math.ceil(cat.media3Meses * 1.05 / 10) * 10
      : Math.ceil(cat.gastoMes * 1.1 / 10) * 10

    if (sugerido < 50) continue

    limitSuggestions.push({
      categoriaId: cat.categoriaId,
      categoriaNome: cat.nome,
      valorSugerido: sugerido,
      motivo: cat.media3Meses > 0
        ? `Média dos últimos 3 meses: R$ ${cat.media3Meses.toFixed(0)}`
        : `Gasto atual no mês: R$ ${cat.gastoMes.toFixed(0)}`,
    })
  }

  let headline = base.headline
  let detail = base.detail
  let tone: FinanceCoachAdvice['tone'] = base.tone === 'wait' ? 'urgent' : base.tone

  if (ctx.ritmoDiarioSeguro != null && ctx.ritmoDiario > ctx.ritmoDiarioSeguro * 1.2)
  {
    tone = 'caution'
    headline = 'Ritmo acima do seguro'
    detail = `Você está gastando ~${fmt(ctx.ritmoDiario)}/dia, mas a folga permite só ~${fmt(ctx.ritmoDiarioSeguro)}/dia até o fim do mês. Desacelere nos próximos dias.`
  }

  if (ctx.categoriasEstouradas.length > 0)
  {
    const c = ctx.categoriasEstouradas[0]
    tone = 'urgent'
    headline = `Limite estourado · ${c.nome}`
    detail = `${c.nome} passou do teto (R$ ${c.gastoMes.toFixed(0)} de R$ ${c.limiteAtual.toFixed(0)}). Evite novos gastos nessa categoria até o próximo mês.`
  }
  else if (ctx.folga > 0 && ctx.ritmoDiarioSeguro != null && tone === 'ok')
  {
    headline = 'Seu teto diário'
    detail = `Com a folga atual, tente não passar de ${fmt(ctx.ritmoDiarioSeguro)} por dia em gastos variáveis (PIX, mercado, lazer) nos ${ctx.diasRestantes} dias restantes.`
  }

  const topAcima = ctx.categorias.find((c) => c.acimaDaMedia)
  if (topAcima && tone === 'ok')
  {
    tone = 'caution'
    detail = `${topAcima.nome} está ${Math.round(((topAcima.gastoMes / topAcima.media3Meses) - 1) * 100)}% acima da sua média recente. Vale definir um limite.`
  }

  return {
    tone,
    headline,
    detail,
    limiteDiarioSugerido: ctx.ritmoDiarioSeguro,
    limitSuggestions,
    source: 'local',
  }
}

function fmt(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Payload compacto para a API Groq */
export function serializeCoachContextForIA(ctx: FinanceCoachContext): Record<string, unknown>
{
  return {
    mes: ctx.monthLabel,
    diasRestantes: ctx.diasRestantes,
    saldoDisponivel: ctx.saldoDisponivel,
    saldoProjetado: ctx.saldoProjetado,
    folga: ctx.folga,
    receitaMes: ctx.receitaMes,
    despesaMes: ctx.despesaMes,
    ritmoDiario: ctx.ritmoDiario,
    limiteDiarioSeguro: ctx.ritmoDiarioSeguro,
    topGastos: ctx.categorias.slice(0, 5).map((c) => ({
      nome: c.nome,
      gastoMes: c.gastoMes,
      media3Meses: c.media3Meses,
      temLimite: c.temLimite,
      limite: c.limiteAtual,
      pctLimite: c.pctLimite,
    })),
    semLimite: ctx.categoriasSemLimite.map((c) => c.nome),
    estouradas: ctx.categoriasEstouradas.map((c) => c.nome),
  }
}
