// "Posso fazer isso hoje?" — veredito explicável (dinheiro, energia, prazo)

import type { TarefaUnificada } from '../types'
import type {
  BudgetLimit,
  Category,
  ContaFixa,
  FinanceBillSettlement,
  ReservedBill,
  Transaction,
  VirtualCard,
} from '../store/storeTypes'
import type { CashAccountSettings } from '../store/storeTypes'
import type { MoodOrchestrationContext } from './moodOrchestration'
import { buildDayCapacity } from './dayCapacity'
import { buildLocalPurchaseVerdict } from './financePurchaseCheck'
import { computeMentalLoad } from './energyOrchestration'
import { buildCategoryBudgetRows } from './financeCategoryBudget'

export type AxelIntentKind =
  | 'compra'
  | 'compromisso'
  | 'projeto_extra'
  | 'social'
  | 'generico'

export type VerdictTone = 'ok' | 'caution' | 'wait'

export interface AxelVerdictBullet
{
  axis: 'dinheiro' | 'energia' | 'prazo'
  label: string
  detail: string
  pct: number
}

export interface AxelTodayVerdict
{
  intent: AxelIntentKind
  tone: VerdictTone
  headline: string
  summary: string
  bullets: AxelVerdictBullet[]
  suggestedAction?: string
  rulesApplied: string[]
}

export interface AxelTodayVerdictInput
{
  question: string
  hojeTasks: TarefaUnificada[]
  dailyScoreCap: number
  mood?: MoodOrchestrationContext | null
  transactions: Transaction[]
  monthTransactions: Transaction[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  cashAccount: CashAccountSettings
  reservedBills: ReservedBill[]
  contasFixas: ContaFixa[]
  billSettlements: FinanceBillSettlement[]
  cards: VirtualCard[]
  recentNoteSnippet?: string
}

const COMPRA_RE = /compr|gast|pagar|investir|assin|pedir|delivery|ifood|mercado|presente/i
const COMPROMISSO_RE = /dentist|médic|consulta|marcar|reunião|quinta|sexta|segunda|terça|quarta|sábado|domingo|amanhã|hoje à/i
const PROJETO_RE = /aceitar|projeto|freelance|extra|demanda|cliente novo|proposta/i
const SOCIAL_RE = /sair|festa|bar|cinema|viagem|jantar|encontro/i

const MONEY_RE = /r\$\s*([\d.,]+)|(\d+[\.,]?\d*)\s*reais?/i

function parseMoneyFromText(text: string): number | null
{
  const m = text.match(MONEY_RE)
  if (!m) return null
  const raw = (m[1] ?? m[2] ?? '').replace(/\./g, '').replace(',', '.')
  const n = parseFloat(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}

export function classifyAxelIntent(question: string): AxelIntentKind
{
  const q = question.trim().toLowerCase()
  if (COMPRA_RE.test(q)) return 'compra'
  if (PROJETO_RE.test(q)) return 'projeto_extra'
  if (COMPROMISSO_RE.test(q)) return 'compromisso'
  if (SOCIAL_RE.test(q)) return 'social'
  return 'generico'
}

function toneFromScore(score: number): VerdictTone
{
  if (score >= 68) return 'ok'
  if (score >= 42) return 'caution'
  return 'wait'
}

function fmtBrl(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function lazerBudgetPct(
  categories: Category[],
  budgetLimits: BudgetLimit[],
  monthTx: Transaction[],
): { pct: number; nome: string }
{
  const rows = buildCategoryBudgetRows(categories, budgetLimits, monthTx)
  const lazer = rows.find((r) => /lazer|entreten|social/i.test(r.nome))
  if (!lazer || lazer.limite <= 0) return { pct: 50, nome: 'lazer' }
  return { pct: Math.round((lazer.gasto / lazer.limite) * 100), nome: lazer.nome }
}

export function buildAxelTodayVerdict(input: AxelTodayVerdictInput): AxelTodayVerdict
{
  const question = input.question.trim()
  const intent = classifyAxelIntent(question)
  const rulesApplied: string[] = []

  const capacity = buildDayCapacity({
    hojeTasks: input.hojeTasks,
    dailyScoreCap: input.dailyScoreCap,
    mood: input.mood,
    transactions: input.transactions,
    cashAccount: input.cashAccount,
    reservedBills: input.reservedBills,
    contasFixas: input.contasFixas,
    billSettlements: input.billSettlements,
  })
  rulesApplied.push('capacidade_do_dia', 'gargalo_humor_finanças_kanban')

  const moodFactor = capacity.factors.find((f) => f.id === 'mood')!
  const financeFactor = capacity.factors.find((f) => f.id === 'finance')!
  const kanbanFactor = capacity.factors.find((f) => f.id === 'kanban')!

  const activeHoje = input.hojeTasks.filter((t) => t.status !== 'concluida')
  const load = computeMentalLoad(activeHoje, input.dailyScoreCap, input.mood)
  rulesApplied.push('carga_mental_kanban')

  const valor = parseMoneyFromText(question)

  if (intent === 'compra' && valor != null && valor > 0)
  {
    const purchase = buildLocalPurchaseVerdict({
      descricao: question,
      valor,
      transactions: input.transactions,
      monthTransactions: input.monthTransactions,
      categories: input.categories,
      budgetLimits: input.budgetLimits,
      saldoInicial: input.cashAccount.saldo_inicial,
      reservedBills: input.reservedBills,
      cards: input.cards,
      moodProfile: input.mood?.profile,
    })
    rulesApplied.push('e11_folga_categoria')

    return {
      intent,
      tone: purchase.tone,
      headline: purchase.headline,
      summary: purchase.detail,
      bullets: [
        {
          axis: 'dinheiro',
          label: 'Dinheiro',
          detail: `Folga após compra: ${fmtBrl(purchase.folgaAposCompra)}`,
          pct: financeFactor.pct,
        },
        {
          axis: 'energia',
          label: 'Energia',
          detail: moodFactor.detail,
          pct: moodFactor.pct,
        },
        {
          axis: 'prazo',
          label: 'Ritmo do mês',
          detail: purchase.limiteDiarioRestante != null
            ? `~${fmtBrl(purchase.limiteDiarioRestante)}/dia até o fim do mês`
            : kanbanFactor.detail,
          pct: Math.round((financeFactor.pct + kanbanFactor.pct) / 2),
        },
      ],
      suggestedAction: purchase.tone === 'wait'
        ? `Adie ${purchase.diasSugeridos ?? 3} dia(s) ou reduza o valor.`
        : 'Se for essencial, registre no financeiro depois de confirmar.',
      rulesApplied,
    }
  }

  let tone: VerdictTone = toneFromScore(capacity.score)
  let headline = 'Dá para encaixar com cuidado'
  let summary = capacity.axelPhrase
  let prazoDetail = `${activeHoje.length} tarefa(s) em Hoje · carga ${load.percent}%`
  let dinheiroDetail = financeFactor.detail
  let energiaDetail = moodFactor.detail

  if (intent === 'compromisso')
  {
    rulesApplied.push('compromisso_humor_prazo')
    if (moodFactor.pct < 40)
    {
      tone = 'wait'
      headline = 'Melhor remarcar ou encurtar'
      summary = 'Humor/energia baixos — compromissos longos drenam mais do que parecem.'
    }
    else if (kanbanFactor.pct < 45)
    {
      tone = 'caution'
      headline = 'Vai, mas proteja o resto do dia'
      summary = 'Agenda já pesada — combine horário que não roube o Kanban de Hoje.'
    }
    else
    {
      tone = 'ok'
      headline = 'Pode marcar'
      summary = 'Energia e folga ok para um compromisso pontual.'
    }
    prazoDetail = activeHoje.length >= 5
      ? 'Dia cheio — prefira fim de tarde ou outro dia'
      : 'Há espaço na agenda de Hoje'
  }

  if (intent === 'projeto_extra')
  {
    rulesApplied.push('projeto_cap_kanban_orcamento')
    const lazer = lazerBudgetPct(input.categories, input.budgetLimits, input.monthTransactions)
    rulesApplied.push('orcamento_lazer_trabalho')

    if (load.percent >= 85 || kanbanFactor.pct < 40)
    {
      tone = 'wait'
      headline = 'Não aceite agora'
      summary = `Kanban em ${load.percent}% — projeto extra quebra a ofensiva.`
    }
    else if (lazer.pct >= 90 || financeFactor.pct < 45)
    {
      tone = 'caution'
      headline = 'Só se pagar bem e for curto'
      summary = `${lazer.nome} em ${lazer.pct}% do orçamento — negocie prazo e valor.`
      dinheiroDetail = `Orçamento ${lazer.nome}: ${lazer.pct}% usado`
    }
    else
    {
      tone = moodFactor.pct >= 55 ? 'ok' : 'caution'
      headline = tone === 'ok' ? 'Pode aceitar com limite' : 'Aceite só se for leve'
      summary = 'Capacidade e caixa aguentam — defina teto de horas na semana.'
    }
    prazoDetail = `Cap Kanban: ${input.dailyScoreCap} pts · ${load.percent}% usado`
  }

  if (intent === 'social')
  {
    rulesApplied.push('social_impulso_orcamento')
    const lazer = lazerBudgetPct(input.categories, input.budgetLimits, input.monthTransactions)
    if (capacity.impulseRisk || lazer.pct >= 85)
    {
      tone = 'wait'
      headline = 'Adie o passeio'
      summary = 'Combinação humor + caixa sugere dia de pouco gasto social.'
      dinheiroDetail = lazer.pct >= 85 ? `${lazer.nome} no limite (${lazer.pct}%)` : financeFactor.detail
    }
    else if (moodFactor.pct < 45)
    {
      tone = 'caution'
      headline = 'Social leve, sem pressão'
      summary = 'Energia baixa — encontro curto e barato, se fizer sentido.'
    }
    else
    {
      tone = 'ok'
      headline = 'Pode sair com teto'
      summary = 'Reserve um valor fixo e volte no horário que protege o sono.'
    }
  }

  if (input.recentNoteSnippet)
  {
    rulesApplied.push('nota_recente_contexto')
    if (/ansios|preocup|apertad|sem dinheiro/i.test(input.recentNoteSnippet))
    {
      if (tone === 'ok') tone = 'caution'
      summary += ' Sua nota recente pede mais cautela.'
    }
  }

  return {
    intent,
    tone,
    headline,
    summary,
    bullets: [
      { axis: 'dinheiro', label: 'Dinheiro', detail: dinheiroDetail, pct: financeFactor.pct },
      { axis: 'energia', label: 'Energia', detail: energiaDetail, pct: moodFactor.pct },
      { axis: 'prazo', label: 'Prazo', detail: prazoDetail, pct: kanbanFactor.pct },
    ],
    suggestedAction:
      tone === 'wait'
        ? 'Adie para outro dia ou reduza o escopo.'
        : tone === 'caution'
          ? 'Faça versão mínima — confirme depois no Kanban.'
          : 'Vá em frente e registre o que fizer.',
    rulesApplied,
  }
}

export function canUseAxelAsk(level: number): boolean
{
  return level >= 3
}

export const AXEL_ASK_UNLOCK_LEVEL = 3

export const AXEL_ASK_EXAMPLES = [
  'Posso comprar tênis de R$ 350?',
  'Marcar dentista quinta?',
  'Aceitar projeto extra esse mês?',
  'Sair com amigos hoje?',
] as const
