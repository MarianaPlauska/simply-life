// Previsão 7 dias — mini forecast local (nível 9+)

import type { ContaFixa, FinanceBillSettlement, ReservedBill, Transaction } from '../store/storeTypes'
import type { DiaHumorAgregado } from './moodInsights'
import { buildUpcomingBills } from './financeUpcomingBills'

export interface AxelForecastDay
{
  iso: string
  label: string
  billsTotal: number
  billCount: number
  spendPace: number
  moodHint: 'leve' | 'neutro' | 'pesado'
  axelLine: string
}

export interface AxelWeekForecast
{
  days: AxelForecastDay[]
  weekBillsTotal: number
  avgDailySpend: number
  moodTrend: 'subindo' | 'estável' | 'caindo'
  headline: string
}

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function addDays(ref: Date, n: number): Date
{
  const d = new Date(ref)
  d.setDate(d.getDate() + n)
  return d
}

function isoDay(d: Date): string
{
  return d.toISOString().slice(0, 10)
}

function avgDailySpend(transactions: Transaction[], ref = new Date()): number
{
  const start = new Date(ref)
  start.setDate(start.getDate() - 14)
  const startIso = isoDay(start)
  const despesas = transactions.filter((t) =>
    t.tipo === 'despesa'
    && t.data >= startIso
    && t.data <= isoDay(ref),
  )
  if (!despesas.length) return 0
  const total = despesas.reduce((s, t) => s + t.valor, 0)
  return total / 14
}

function moodTrend(humorSemana: DiaHumorAgregado[]): 'subindo' | 'estável' | 'caindo'
{
  if (humorSemana.length < 4) return 'estável'
  const sorted = [...humorSemana].sort((a, b) => a.data.localeCompare(b.data))
  const first = sorted.slice(0, Math.floor(sorted.length / 2))
  const second = sorted.slice(Math.floor(sorted.length / 2))
  const avg = (rows: DiaHumorAgregado[]) =>
    rows.reduce((s, r) => s + r.humor, 0) / rows.length
  const delta = avg(second) - avg(first)
  if (delta >= 0.35) return 'subindo'
  if (delta <= -0.35) return 'caindo'
  return 'estável'
}

export function buildAxelWeekForecast(input: {
  transactions: Transaction[]
  contasFixas: ContaFixa[]
  reservedBills: ReservedBill[]
  billSettlements: FinanceBillSettlement[]
  cards: import('../store/storeTypes').VirtualCard[]
  humorSemana: DiaHumorAgregado[]
  reference?: Date
}): AxelWeekForecast
{
  const ref = input.reference ?? new Date()
  const avgSpend = avgDailySpend(input.transactions, ref)
  const upcoming = buildUpcomingBills({
    contasFixas: input.contasFixas,
    cards: input.cards,
    transactions: input.transactions,
    reservedBills: input.reservedBills,
    settlements: input.billSettlements,
    horizonDays: 8,
    reference: ref,
  })

  const trend = moodTrend(input.humorSemana)
  const days: AxelForecastDay[] = []

  for (let i = 0; i < 7; i++)
  {
    const d = addDays(ref, i)
    const iso = isoDay(d)
    const dayBills = upcoming.filter((b) => b.dueDate === iso)
    const billsTotal = dayBills.reduce((s, b) => s + b.valor, 0)
    const spendPace = Math.round(avgSpend)

    let moodHint: AxelForecastDay['moodHint'] = 'neutro'
    if (trend === 'caindo' && i >= 4) moodHint = 'pesado'
    if (trend === 'subindo') moodHint = 'leve'
    if (billsTotal > avgSpend * 2 && billsTotal > 80) moodHint = 'pesado'

    let axelLine = 'Ritmo normal — sem contas grandes.'
    if (billsTotal > 0 && billsTotal >= spendPace)
    {
      axelLine = `${dayBills.length} conta(s) · ${billsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}`
    }
    else if (spendPace > 0 && moodHint === 'pesado')
    {
      axelLine = `Gastos ~${spendPace.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}/dia — vá leve.`
    }

    days.push({
      iso,
      label: i === 0 ? 'Hoje' : WEEKDAY[d.getDay()],
      billsTotal,
      billCount: dayBills.length,
      spendPace,
      moodHint,
      axelLine,
    })
  }

  const weekBillsTotal = days.reduce((s, d) => s + d.billsTotal, 0)
  const heavyDays = days.filter((d) => d.moodHint === 'pesado').length

  let headline = 'Semana equilibrada — contas e humor sob controle.'
  if (weekBillsTotal > avgSpend * 10)
  {
    headline = 'Semana com contas concentradas — planeje folga nos dias leves.'
  }
  else if (heavyDays >= 3)
  {
    headline = 'Humor em queda + gastos — priorize dias com menos contas.'
  }
  else if (trend === 'subindo')
  {
    headline = 'Humor subindo — boa janela para 1–2 prioridades extras.'
  }

  return {
    days,
    weekBillsTotal,
    avgDailySpend: avgSpend,
    moodTrend: trend,
    headline,
  }
}

export const AXEL_FORECAST_UNLOCK_LEVEL = 9
