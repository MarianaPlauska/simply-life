// Capacidade do dia — termômetro único (humor + finanças + Kanban)

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
  if (!hasMood || humorMedia == null) return 52
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

  if (folga >= 1500) return { pct: 95, detail: `Folga ${fmt(folga)} após a semana` }
  if (folga >= 500) return { pct: 78, detail: `Folga ${fmt(folga)} — confortável` }
  if (folga >= 0) return { pct: 58, detail: `Apertado: ${fmt(folga)} após boletos` }
  if (folga >= -500) return { pct: 35, detail: `Déficit ${fmt(Math.abs(folga))} na semana` }
  return { pct: 18, detail: `Pressão alta: ${fmt(Math.abs(folga))} a cobrir` }
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

  const load = computeMentalLoad(active, cap, mood)
  let pct = Math.max(0, 100 - load.percent)
  if (overdue > 0)
  {
    pct = Math.max(0, pct - overdue * 12)
  }

  let detail = `${load.percent}% da carga de Hoje`
  if (overdue > 0) detail += ` · ${overdue} vencida${overdue !== 1 ? 's' : ''}`
  return { pct: Math.round(pct), detail, overdue }
}

function resolveMode(score: number): CapacityMode
{
  if (score >= 75) return 'pleno'
  if (score >= 55) return 'equilibrado'
  if (score >= 35) return 'cuidado'
  return 'critico'
}

function buildAxelPhrase(
  mode: CapacityMode,
  importantTasks: number,
  impulseRisk: boolean,
  moodProfile: string | undefined,
): string
{
  if (mode === 'pleno')
  {
    return impulseRisk
      ? `Hoje é dia de ${importantTasks} coisa${importantTasks !== 1 ? 's' : ''} importante${importantTasks !== 1 ? 's' : ''} — caixa ok, mas evite compra por impulso.`
      : `Energia boa e folga na semana — até ${importantTasks} foco${importantTasks !== 1 ? 's' : ''} importantes cabem bem.`
  }
  if (mode === 'equilibrado')
  {
    return `Ritmo sustentável: ${importantTasks} prioridade${importantTasks !== 1 ? 's' : ''} em Hoje e zero drama no cartão.`
  }
  if (mode === 'cuidado')
  {
    if (moodProfile === 'recuperacao' || moodProfile === 'cuidado')
    {
      return `Hoje é dia de ${importantTasks} coisa${importantTasks !== 1 ? 's' : ''} importante${importantTasks !== 1 ? 's' : ''} e zero compras por impulso — você está em modo cuidado.`
    }
    return `Modo cuidado: poucas tarefas, sem gasto emocional. O AXEL segurou a carga.`
  }
  return `Capacidade baixa — proteja energia e caixa. Só o essencial hoje.`
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

  const score = Math.round(moodPct * 0.35 + finance.pct * 0.30 + kanban.pct * 0.35)
  const mode = resolveMode(score)

  const impulseRisk = finance.pct < 50 && moodPct < 55
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
          : 'Registre humor para calibrar',
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
