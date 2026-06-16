import type { MoodProfile } from './moodOrchestration'
import { adviseSpend, daysUntilMonthEnd } from './financeSpendAdvice'
import { buildCategoryBudgetRows } from './financeCategoryBudget'
import { computeCashPosition } from './financeReservedBills'
import { sumOpenInvoiceSpend } from './financeCardSpend'
import type {
  BudgetLimit,
  Category,
  ReservedBill,
  Transaction,
  VirtualCard,
} from '../store/storeTypes'

export type PurchaseVerdictTone = 'ok' | 'caution' | 'wait'

export interface PurchaseCheckInput
{
  descricao: string
  valor: number
  categoriaId?: number
  cardId?: string
  formaPagamento?: string
  transactions: Transaction[]
  monthTransactions: Transaction[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  saldoInicial: number
  reservedBills: ReservedBill[]
  cards: VirtualCard[]
  moodProfile?: MoodProfile
}

export interface PurchaseVerdict
{
  tone: PurchaseVerdictTone
  headline: string
  detail: string
  folgaAposCompra: number
  limiteDiarioRestante: number | null
  categoriaNome?: string
  categoriaPctApos?: number
  diasSugeridos?: number
  source: 'local' | 'groq'
}

function monthTxFilter(transactions: Transaction[], ref = new Date()): Transaction[]
{
  const m = ref.getMonth()
  const y = ref.getFullYear()
  return transactions.filter((t) =>
  {
    const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
    return d.getMonth() === m && d.getFullYear() === y
  })
}

export function buildPurchaseCheckContext(input: PurchaseCheckInput, ref = new Date())
{
  const position = computeCashPosition(
    input.transactions,
    input.saldoInicial,
    input.reservedBills,
  )
  const diasRestantes = daysUntilMonthEnd(ref)
  const folga = position.saldoProjetadoDisponivel - position.pendentes - position.agendados
  const folgaApos = folga - input.valor

  const monthTx = input.monthTransactions.length > 0
    ? input.monthTransactions
    : monthTxFilter(input.transactions, ref)

  let categoriaNome: string | undefined
  let categoriaGasto = 0
  let categoriaLimite = 0
  let categoriaPctApos: number | undefined

  if (input.categoriaId)
  {
    const rows = buildCategoryBudgetRows(
      input.categories,
      input.budgetLimits,
      monthTx,
    )
    const row = rows.find((r) => r.id === input.categoriaId)
    if (row)
    {
      categoriaNome = row.nome
      categoriaGasto = row.gasto
      categoriaLimite = row.limite
      if (row.limite > 0)
      {
        categoriaPctApos = ((row.gasto + input.valor) / row.limite) * 100
      }
    }
    else
    {
      const cat = input.categories.find((c) => c.id === input.categoriaId)
      categoriaNome = cat?.nome
    }
  }

  let limiteCartaoDisponivel: number | undefined
  let cartaoNome: string | undefined
  if (input.cardId)
  {
    const card = input.cards.find((c) => c.id === input.cardId)
    if (card)
    {
      cartaoNome = card.nome
      const gasto = sumOpenInvoiceSpend(input.transactions, card)
      limiteCartaoDisponivel = card.limite - gasto
    }
  }

  const limiteDiarioRestante = folgaApos > 0 && diasRestantes > 0
    ? folgaApos / diasRestantes
    : null

  return {
    descricao: input.descricao,
    valor: input.valor,
    formaPagamento: input.formaPagamento,
    saldoDisponivel: position.saldoDisponivel,
    saldoProjetado: position.saldoProjetadoDisponivel,
    folga,
    folgaAposCompra: folgaApos,
    diasRestantes,
    limiteDiarioRestante,
    categoriaNome,
    categoriaGasto,
    categoriaLimite,
    categoriaPctApos,
    cartaoNome,
    limiteCartaoDisponivel,
  }
}

export function buildLocalPurchaseVerdict(input: PurchaseCheckInput, ref = new Date()): PurchaseVerdict
{
  const ctx = buildPurchaseCheckContext(input, ref)

  let limiteCartaoDisponivel: number | undefined
  if (input.cardId)
  {
    const card = input.cards.find((c) => c.id === input.cardId)
    if (card)
    {
      limiteCartaoDisponivel = card.limite - sumOpenInvoiceSpend(input.transactions, card)
    }
  }

  const position = computeCashPosition(
    input.transactions,
    input.saldoInicial,
    input.reservedBills,
  )

  const base = adviseSpend({
    saldoCorrente: position.saldoCorrente,
    saldoProjetado: ctx.saldoProjetado,
    despesasPendentes: position.pendentes,
    despesasAgendadas: position.agendados,
    compraProposta: input.valor,
    diasAteFimMes: ctx.diasRestantes,
    limiteCartaoDisponivel,
    moodProfile: input.moodProfile,
  })

  let tone: PurchaseVerdictTone = base.tone === 'wait' ? 'wait' : base.tone
  let headline = base.headline
  let detail = base.detail

  if (ctx.categoriaPctApos != null && ctx.categoriaPctApos >= 100)
  {
    tone = 'wait'
    headline = `Estoura ${ctx.categoriaNome}`
    detail = `Com este gasto, ${ctx.categoriaNome} passa de ${ctx.categoriaPctApos.toFixed(0)}% do limite mensal. Adie ou reduza o valor.`
  }
  else if (ctx.categoriaPctApos != null && ctx.categoriaPctApos >= 85)
  {
    tone = 'caution'
    headline = `${ctx.categoriaNome} no limite`
    detail = `Ficaria em ${ctx.categoriaPctApos.toFixed(0)}% do orçamento da categoria. Só compre se for essencial.`
  }
  else if (tone === 'ok' && ctx.limiteDiarioRestante != null && input.valor > ctx.limiteDiarioRestante * 1.5)
  {
    tone = 'caution'
    headline = 'Acima do ritmo do mês'
    detail = `São ${fmt(input.valor)} agora, mas sua folga sugere ~${fmt(ctx.limiteDiarioRestante)}/dia até o fim do mês.`
  }
  else if (tone === 'ok')
  {
    headline = 'Pode comprar'
    detail = ctx.categoriaNome
      ? `Cabe na folga e em ${ctx.categoriaNome}. Sobra projetada: ${fmt(ctx.folgaAposCompra)}.`
      : `Cabe na folga. Sobra projetada: ${fmt(ctx.folgaAposCompra)}.`
  }

  return {
    tone,
    headline,
    detail,
    folgaAposCompra: ctx.folgaAposCompra,
    limiteDiarioRestante: ctx.limiteDiarioRestante,
    categoriaNome: ctx.categoriaNome,
    categoriaPctApos: ctx.categoriaPctApos,
    diasSugeridos: base.diasSugeridos,
    source: 'local',
  }
}

function fmt(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
