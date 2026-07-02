// Capacidade do dia — termômetro conservador (gargalo, não média otimista)

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

  if (folga >= 2000) return { pct: 92, detail: `Folga ${fmt(folga)} após a semana` }
  if (folga >= 800) return { pct: 72, detail: `Folga ${fmt(folga)} — confortável` }
  if (folga >= 300) return { pct: 55, detail: `Margem ${fmt(folga)} após boletos` }
  if (folga >= 0) return { pct: 38, detail: `No limite: ${fmt(folga)} após boletos` }
  if (folga >= -400) return { pct: 22, detail: `Déficit ${fmt(Math.abs(folga))} na semana` }
  return { pct: 12, detail: `Pressão alta: ${fmt(Math.abs(folga))} a cobrir` }
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
    return { pct: 48, detail: 'Hoje vazio — não confunda com energia alta', overdue: 0 }
  }

  const load = computeMentalLoad(active, cap, mood)
  let pct = Math.max(0, 100 - load.percent)
  if (overdue > 0)
  {
    pct = Math.max(0, pct - overdue * 15)
  }

  let detail = `${load.percent}% da carga de Hoje`
  if (overdue > 0) detail += ` · ${overdue} vencida${overdue !== 1 ? 's' : ''}`
  return { pct: Math.round(pct), detail, overdue }
}

function resolveMode(score: number): CapacityMode
{
  if (score >= 72) return 'pleno'
  if (score >= 52) return 'equilibrado'
  if (score >= 32) return 'cuidado'
  return 'critico'
}

function buildAxelPhrase(
  mode: CapacityMode,
  importantTasks: number,
  impulseRisk: boolean,
  moodProfile: string | undefined,
  hasMood: boolean,
): string
{
  if (!hasMood)
  {
    return `Registre humor para calibrar — por ora, sugiro no máximo ${importantTasks} foco${importantTasks !== 1 ? 's' : ''} em Hoje.`
  }
  if (mode === 'pleno')
  {
    return impulseRisk
      ? `Até ${importantTasks} prioridade${importantTasks !== 1 ? 's' : ''} — caixa ok, mas zero compra por impulso.`
      : `Boa margem hoje — até ${importantTasks} foco${importantTasks !== 1 ? 's' : ''} importantes.`
  }
  if (mode === 'equilibrado')
  {
    return `${importantTasks} prioridade${importantTasks !== 1 ? 's' : ''} em Hoje e gasto consciente no cartão.`
  }
  if (mode === 'cuidado')
  {
    if (moodProfile === 'recuperacao' || moodProfile === 'cuidado')
    {
      return `${importantTasks} coisa${importantTasks !== 1 ? 's' : ''} importante${importantTasks !== 1 ? 's' : ''} e zero compras por impulso — modo cuidado.`
    }
    return `Poucas tarefas, sem gasto emocional. O AXEL segurou a carga.`
  }
  return `Capacidade baixa — só o essencial hoje.`
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

  const bottleneck = Math.min(moodPct, finance.pct, kanban.pct)
  const average = (moodPct + finance.pct + kanban.pct) / 3
  const score = Math.round(bottleneck * 0.62 + average * 0.38)

  const mode = resolveMode(score)

  const impulseRisk = finance.pct < 45 && moodPct < 50
  const suggestedImportantTasks =
    mode === 'critico' ? 1
      : mode === 'cuidado' ? 2
        : mode === 'equilibrado' ? 3
          : 4

  const axelPhrase = buildAxelPhrase(
    mode,
    suggestedImportantTasks,
    impulseRisk,
    input.mood?.profile,
    hasMood,
  )

  return {
    score,
    mode,
    axelPhrase,
    impulseRisk,
    suggestedImportantTasks,
    factors: [
      {
        id: 'mood',
        label: 'Humor / energia',
        pct: moodPct,
        detail: hasMood && humorMedia != null
          ? `${humorMedia.toFixed(1)}/5 hoje`
          : 'Sem registro hoje',
      },
      {
        id: 'finance',
        label: 'Folga financeira',
        pct: finance.pct,
        detail: finance.detail,
      },
      {
        id: 'kanban',
        label: 'Carga Kanban',
        pct: kanban.pct,
        detail: kanban.detail,
      },
    ],
  }
}
