import {
  computeCapacityScore,
  resolveMode,
  resolveWeightedBottleneck,
  type CapacityFactorId,
} from './dayCapacityModel'
import { pickCapacityPhrase } from './dayCapacityPhrases'
import { buildCapacityExplanation, type CapacityExplanation } from './dayCapacityExplain'
import type { TarefaUnificada } from '../types'
import type { ContaFixa, FinanceBillSettlement, ReservedBill, Transaction } from '../store/storeTypes'
import type { CashAccountSettings } from '../store/storeTypes'
import { computeMentalLoad } from './energyOrchestration'
import type { MoodOrchestrationContext } from './moodOrchestration'
import { computeCashPosition } from './financeReservedBills'
import { contaFixaEfetivamenteAtiva } from './financeContaFixa'
import { isContaFixaSatisfiedThisMonth } from './financeRecurringPost'

export type CapacityMode = 'pleno' | 'equilibrado' | 'cuidado' | 'critico'

export interface DayCapacityFactor
{
  id: 'mood' | 'finance' | 'kanban'
  label: string
  shortLabel: string
  pct: number
  detail: string
}

export interface DayCapacity
{
  score: number
  mode: CapacityMode
  axelPhrase: string
  impulseRisk: boolean
  suggestedImportantTasks: number
  factors: DayCapacityFactor[]
  bottleneckId: DayCapacityFactor['id']
  explanation: CapacityExplanation
}

function sumBillsThisWeek(
  contasFixas: ContaFixa[],
  transactions: Transaction[],
  settlements: FinanceBillSettlement[],
  reservedBills: ReservedBill[],
  ref: Date,
): { total: number; labels: string[] }
{
  const labels: string[] = []
  let total = 0
  const weekEnd = new Date(ref)
  weekEnd.setDate(weekEnd.getDate() + 7)

  for (const conta of contasFixas)
  {
    if (!contaFixaEfetivamenteAtiva(conta, ref)) continue
    if (isContaFixaSatisfiedThisMonth(conta, transactions, settlements, ref)) continue

    const due = new Date(ref.getFullYear(), ref.getMonth(), conta.dia_vencimento)
    if (due < ref) due.setMonth(due.getMonth() + 1)
    if (due <= weekEnd)
    {
      total += conta.valor
      labels.push(conta.nome)
    }
  }

  for (const bill of reservedBills)
  {
    if (bill.status !== 'aberta') continue
    const dueStr = bill.data_vencimento?.slice(0, 10)
    if (!dueStr) continue
    const due = new Date(`${dueStr}T12:00:00`)
    if (due >= ref && due <= weekEnd)
    {
      const restante = Math.max(0, bill.valor_alocado - bill.valor_gasto)
      total += restante
      if (bill.titulo) labels.push(bill.titulo)
    }
  }

  return { total, labels: labels.slice(0, 3) }
}

function moodToPct(
  humorMedia: number | null,
  energia: number | null,
  hasMood: boolean,
): number
{
  if (!hasMood || humorMedia == null) return 32
  let pct = (humorMedia / 5) * 100
  if (energia != null)
  {
    pct = pct * 0.7 + (energia / 5) * 100 * 0.3
  }
  return Math.round(Math.min(100, Math.max(0, pct)))
}

function financeToPct(saldoDisponivel: number, compromissosSemana: number): { pct: number; detail: string }
{
  const folga = saldoDisponivel - compromissosSemana
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

  if (compromissosSemana <= 0)
  {
    return { pct: 85, detail: `Sem boletos nos próximos 7 dias · saldo ${fmt(saldoDisponivel)}` }
  }

  if (folga >= 2000) return { pct: 92, detail: `Sobra ${fmt(folga)} após boletos da semana` }
  if (folga >= 800) return { pct: 72, detail: `Sobra ${fmt(folga)} após boletos da semana` }
  if (folga >= 300) return { pct: 55, detail: `Margem ${fmt(folga)} após boletos da semana` }
  if (folga >= 0) return { pct: 38, detail: `No limite: sobra ${fmt(folga)} após boletos` }
  if (folga >= -400) return { pct: 22, detail: `Falta ${fmt(Math.abs(folga))} para cobrir a semana` }
  return { pct: 12, detail: `Falta ${fmt(Math.abs(folga))} para cobrir boletos da semana` }
}

function kanbanToPct(
  hojeTasks: TarefaUnificada[],
  cap: number,
  mood: MoodOrchestrationContext | null | undefined,
): { pct: number; detail: string; overdue: number }
{
  const active = hojeTasks.filter((t) => t.status !== 'concluida')
  const overdue = active.filter((t) =>
  {
    if (!t.data_vencimento) return false
    return new Date(t.data_vencimento).getTime() < Date.now()
  }).length

  if (active.length === 0)
  {
    return { pct: 48, detail: 'Hoje vazio · não confunda com energia alta', overdue: 0 }
  }

  const load = computeMentalLoad(active, cap, mood)
  let pct = Math.max(0, 100 - load.percent)
  if (overdue > 0)
  {
    pct = Math.max(0, pct - overdue * 15)
  }

  let detail = `${load.percent}% da carga em Hoje`
  if (overdue > 0) detail += ` · ${overdue} vencida${overdue !== 1 ? 's' : ''}`
  return { pct: Math.round(pct), detail, overdue }
}

const FACTOR_SHORT: Record<DayCapacityFactor['id'], string> = {
  mood: 'Humor',
  finance: 'Folga',
  kanban: 'Carga',
}

function resolveBottleneck(
  factors: DayCapacityFactor[],
): CapacityFactorId
{
  return resolveWeightedBottleneck(
    factors.map((f) => ({ id: f.id, pct: f.pct })),
  )
}

function buildAxelPhrase(
  mode: CapacityMode,
  importantTasks: number,
  impulseRisk: boolean,
  moodProfile: string | undefined,
  hasMood: boolean,
  bottleneck: DayCapacityFactor,
  seed: string,
): string
{
  return pickCapacityPhrase({
    mode,
    bottleneckId: bottleneck.id,
    bottleneckLabel: bottleneck.shortLabel,
    bottleneckDetail: bottleneck.detail,
    bottleneckPct: bottleneck.pct,
    importantTasks,
    hasMood,
    impulseRisk,
    moodProfile,
    seed,
  })
}

export function buildDayCapacity(input: {
  hojeTasks: TarefaUnificada[]
  dailyScoreCap: number
  mood?: MoodOrchestrationContext | null
  transactions: Transaction[]
  cashAccount: CashAccountSettings
  reservedBills: ReservedBill[]
  contasFixas: ContaFixa[]
  billSettlements: FinanceBillSettlement[]
  reference?: Date
}): DayCapacity
{
  const ref = input.reference ?? new Date()
  const humorMedia = input.mood?.humorMedia ?? null
  const energia = input.mood?.energia ?? null
  const hasMood = input.mood?.hasMoodToday ?? false

  const moodPct = moodToPct(humorMedia, energia, hasMood)

  const cash = computeCashPosition(
    input.transactions,
    input.cashAccount.saldo_inicial,
    input.reservedBills,
    {
      contasFixas: input.contasFixas,
      billSettlements: input.billSettlements,
      reference: ref,
    },
  )
  const { total: compromissosSemana } = sumBillsThisWeek(
    input.contasFixas,
    input.transactions,
    input.billSettlements,
    input.reservedBills,
    ref,
  )
  const finance = financeToPct(cash.saldoDisponivel, compromissosSemana)

  const kanban = kanbanToPct(input.hojeTasks, input.dailyScoreCap, input.mood)

  const factors: DayCapacityFactor[] = [
    {
      id: 'mood',
      label: 'Humor / energia',
      shortLabel: FACTOR_SHORT.mood,
      pct: moodPct,
      detail: hasMood && humorMedia != null
        ? `${humorMedia.toFixed(1)}/5 hoje`
        : 'Sem registro hoje',
    },
    {
      id: 'finance',
      label: 'Folga financeira',
      shortLabel: FACTOR_SHORT.finance,
      pct: finance.pct,
      detail: finance.detail,
    },
    {
      id: 'kanban',
      label: 'Carga Kanban',
      shortLabel: FACTOR_SHORT.kanban,
      pct: kanban.pct,
      detail: kanban.detail,
    },
  ]

  const bottleneckId = resolveBottleneck(factors)
  const bottleneck = factors.find((f) => f.id === bottleneckId) ?? factors[0]

  const score = computeCapacityScore(factors.map((f) => ({ id: f.id, pct: f.pct })))

  const mode = resolveMode(score)

  const impulseRisk = finance.pct < 45 && moodPct < 50
  const suggestedImportantTasks =
    mode === 'critico' ? 1
      : mode === 'cuidado' ? 2
        : mode === 'equilibrado' ? 3
          : 4

  const daySeed = ref.toISOString().slice(0, 10)

  const axelPhrase = buildAxelPhrase(
    mode,
    suggestedImportantTasks,
    impulseRisk,
    input.mood?.profile,
    hasMood,
    bottleneck,
    daySeed,
  )

  const explanation = buildCapacityExplanation(factors, bottleneckId, score)

  return {
    score,
    mode,
    axelPhrase,
    impulseRisk,
    suggestedImportantTasks,
    factors,
    bottleneckId,
    explanation,
  }
}
