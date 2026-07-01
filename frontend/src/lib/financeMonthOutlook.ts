import { billRemaining, computeCashPosition } from './financeReservedBills'
import type {
  BudgetLimit,
  Category,
  ContaFixa,
  RecurringIncome,
  ReservedBill,
  Transaction,
} from '../store/storeTypes'

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

/** Quantos meses à frente o planner permite navegar */
export const FINANCE_MAX_FUTURE_OFFSET = 5

/** Quantos meses no passado o planner permite navegar */
export const FINANCE_MAX_PAST_OFFSET = 5

export interface OutlookLineItem
{
  label: string
  valor: number
  hint?: string
}

export interface ForecastComparison
{
  receitasPrevistas: number
  receitasReais: number
  deltaReceitas: number
  compromissosPrevistos: number
  compromissosReais: number
  deltaCompromissos: number
  sobraPrevista: number
  saldoReal: number
  deltaSaldo: number
}

export interface MonthOutlook
{
  monthLabel: string
  monthOffset: number
  isFuture: boolean
  isPast: boolean
  /** Saldo disponível ao entrar no mês (projetado a partir de hoje) */
  saldoPartida: number
  receitasPrevistas: number
  receitasItens: OutlookLineItem[]
  compromissos: number
  compromissosItens: OutlookLineItem[]
  agendadosMes: number
  saldoAposCompromissos: number
  /** Sobra estimada para gastos variáveis (mercado, lazer, PIX do dia a dia) */
  sobraParaGastar: number
  sugestaoGastoDiario: number | null
  diasNoMes: number
  tone: 'ok' | 'caution' | 'urgent'
  headline: string
  detail: string
  /** Previsto vs real — mês atual ou passado */
  comparison?: ForecastComparison
}

export interface MonthOutlookInput
{
  transactions: Transaction[]
  saldoInicial: number
  reservedBills: ReservedBill[]
  recurringIncomes: RecurringIncome[]
  contasFixas: ContaFixa[]
  budgetLimits: BudgetLimit[]
  categories: Category[]
  monthOffset: number
  saldoPartidaOverride?: number
}

interface PlannedMonthSlice
{
  receitasPrevistas: number
  receitasItens: OutlookLineItem[]
  compromissos: number
  compromissosItens: OutlookLineItem[]
  agendadosMes: number
}

interface ActualMonthSlice
{
  receitas: number
  despesas: number
  saldo: number
  receitaItens: OutlookLineItem[]
  despesaItens: OutlookLineItem[]
}

function targetMonthDate(monthOffset: number, ref = new Date()): Date
{
  return new Date(ref.getFullYear(), ref.getMonth() + monthOffset, 1)
}

function isInMonth(isoDate: string, year: number, month: number): boolean
{
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`)
  return d.getFullYear() === year && d.getMonth() === month
}

function sumBudgetLimits(limits: BudgetLimit[]): number
{
  return limits.reduce((s, b) => s + b.limite, 0)
}

function computePlannedMonthSlice(
  input: Omit<MonthOutlookInput, 'monthOffset' | 'saldoPartidaOverride'>,
  year: number,
  month: number,
): PlannedMonthSlice
{
  const receitasItens: OutlookLineItem[] = []
  let receitasPrevistas = 0

  for (const r of input.recurringIncomes.filter((x) => x.ativa))
  {
    receitasItens.push({
      label: r.titulo,
      valor: r.valor,
      hint: `dia ${r.dia_recebimento}`,
    })
    receitasPrevistas += r.valor
  }

  const compromissosItens: OutlookLineItem[] = []
  let compromissos = 0

  for (const c of input.contasFixas.filter((x) => x.ativa))
  {
    compromissosItens.push({
      label: c.nome,
      valor: c.valor,
      hint: `vence dia ${c.dia_vencimento}`,
    })
    compromissos += c.valor
  }

  for (const bill of input.reservedBills.filter((b) => b.status === 'aberta'))
  {
    if (!isInMonth(bill.data_vencimento, year, month)) continue

    const rest = billRemaining(bill)
    if (rest <= 0) continue

    compromissosItens.push({
      label: `Fatura · ${bill.titulo}`,
      valor: rest,
      hint: bill.data_vencimento.slice(0, 10).split('-').reverse().join('/'),
    })
    compromissos += rest
  }

  let agendadosMes = 0
  for (const t of input.transactions)
  {
    if (t.status_pagamento !== 'agendado') continue
    if (!isInMonth(t.data, year, month)) continue
    if (t.tipo === 'receita')
    {
      agendadosMes -= t.valor
    }
    else
    {
      agendadosMes += t.valor
    }
  }

  if (agendadosMes > 0)
  {
    compromissosItens.push({
      label: 'Lançamentos agendados',
      valor: agendadosMes,
    })
    compromissos += agendadosMes
  }

  return {
    receitasPrevistas,
    receitasItens,
    compromissos,
    compromissosItens,
    agendadosMes,
  }
}

function computeActualMonthSlice(
  transactions: Transaction[],
  year: number,
  month: number,
): ActualMonthSlice
{
  const monthTx = transactions.filter((t) => isInMonth(t.data, year, month))
  const receitaTx = monthTx.filter((t) => t.tipo === 'receita')
  const despesaTx = monthTx.filter((t) => t.tipo === 'despesa' || t.tipo === 'investimento')
  const receitas = receitaTx.reduce((s, t) => s + t.valor, 0)
  const despesas = despesaTx.reduce((s, t) => s + t.valor, 0)

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    receitaItens: receitaTx.map((t) => ({
      label: t.descricao,
      valor: t.valor,
      hint: t.observacao?.trim() || undefined,
    })),
    despesaItens: despesaTx.map((t) => ({
      label: t.descricao,
      valor: t.valor,
      hint: t.observacao?.trim() || undefined,
    })),
  }
}

/** Saldo de partida encadeado para meses +2, +3… */
export function resolveChainedSaldoPartida(
  input: Omit<MonthOutlookInput, 'monthOffset' | 'saldoPartidaOverride'>,
  targetOffset: number,
  ref = new Date(),
): number
{
  if (targetOffset <= 0)
  {
    const position = computeCashPosition(
      input.transactions,
      input.saldoInicial,
      input.reservedBills,
    )
    return position.saldoDisponivel
  }

  const position = computeCashPosition(
    input.transactions,
    input.saldoInicial,
    input.reservedBills,
  )

  if (targetOffset === 1)
  {
    return position.saldoProjetadoDisponivel
  }

  let running = position.saldoProjetadoDisponivel

  for (let offset = 1; offset < targetOffset; offset++)
  {
    const d = targetMonthDate(offset, ref)
    const planned = computePlannedMonthSlice(
      input,
      d.getFullYear(),
      d.getMonth(),
    )
    running = running + planned.receitasPrevistas - planned.compromissos
  }

  return running
}

export interface FinanceMonthNavBounds
{
  minOffset: number
  maxOffset: number
}

/** Limites de navegação mensal conforme dados reais (sem tx → só mês atual). */
export function getFinanceMonthNavBounds(
  transactions: Transaction[],
  ref = new Date(),
): FinanceMonthNavBounds
{
  if (transactions.length === 0)
  {
    return {
      minOffset: -FINANCE_MAX_PAST_OFFSET,
      maxOffset: FINANCE_MAX_FUTURE_OFFSET,
    }
  }

  const cy = ref.getFullYear()
  const cm = ref.getMonth()
  let ey = cy
  let em = cm

  for (const t of transactions)
  {
    const d = new Date(`${t.data}T12:00:00`)
    if (d.getFullYear() < ey || (d.getFullYear() === ey && d.getMonth() < em))
    {
      ey = d.getFullYear()
      em = d.getMonth()
    }
  }

  const monthsBack = (cy - ey) * 12 + (cm - em)
  const minOffset = monthsBack === 0
    ? 0
    : -Math.min(FINANCE_MAX_PAST_OFFSET, monthsBack)

  return {
    minOffset,
    maxOffset: FINANCE_MAX_FUTURE_OFFSET,
  }
}

export function clampFinanceMonthOffset(
  offset: number,
  bounds?: FinanceMonthNavBounds,
): number
{
  const min = bounds?.minOffset ?? -FINANCE_MAX_PAST_OFFSET
  const max = bounds?.maxOffset ?? FINANCE_MAX_FUTURE_OFFSET
  return Math.max(min, Math.min(max, offset))
}

export function canShiftFinanceMonth(
  offset: number,
  direction: -1 | 1,
  bounds?: FinanceMonthNavBounds,
): boolean
{
  const next = offset + direction
  const min = bounds?.minOffset ?? -FINANCE_MAX_PAST_OFFSET
  const max = bounds?.maxOffset ?? FINANCE_MAX_FUTURE_OFFSET
  return next >= min && next <= max
}

/** Previsão de um mês — real (passado/atual) ou futuro (compromissos + recorrentes) */
export function buildMonthOutlook(
  input: MonthOutlookInput,
  ref = new Date(),
): MonthOutlook
{
  const target = targetMonthDate(input.monthOffset, ref)
  const year = target.getFullYear()
  const month = target.getMonth()
  const monthLabel = `${MONTH_NAMES[month]} ${year}`
  const diasNoMes = new Date(year, month + 1, 0).getDate()
  const isFuture = input.monthOffset > 0
  const isPast = input.monthOffset < 0

  const planned = computePlannedMonthSlice(input, year, month)
  const orcamentoTotal = sumBudgetLimits(input.budgetLimits)

  let receitasPrevistas = planned.receitasPrevistas
  let receitasItens = planned.receitasItens
  let compromissos = planned.compromissos
  let compromissosItens = planned.compromissosItens
  const agendadosMes = planned.agendadosMes

  let saldoPartida: number
  let saldoAposCompromissos: number
  let sobraParaGastar: number
  let comparison: ForecastComparison | undefined

  if (!isFuture)
  {
    const actual = computeActualMonthSlice(input.transactions, year, month)
    const position = computeCashPosition(
      input.transactions,
      input.saldoInicial,
      input.reservedBills,
    )

    saldoPartida = position.saldoDisponivel
    receitasPrevistas = actual.receitas
    compromissos = actual.despesas
    receitasItens = actual.receitaItens.length > 0
      ? actual.receitaItens
      : actual.receitas > 0
        ? [{ label: 'Receitas lançadas', valor: actual.receitas }]
        : []
    compromissosItens = actual.despesaItens.length > 0
      ? actual.despesaItens
      : actual.despesas > 0
        ? [{ label: 'Despesas lançadas', valor: actual.despesas }]
        : []

    saldoAposCompromissos = actual.saldo
    sobraParaGastar = actual.saldo

    const sobraPrevista = planned.receitasPrevistas - planned.compromissos

    comparison = {
      receitasPrevistas: planned.receitasPrevistas,
      receitasReais: actual.receitas,
      deltaReceitas: actual.receitas - planned.receitasPrevistas,
      compromissosPrevistos: planned.compromissos,
      compromissosReais: actual.despesas,
      deltaCompromissos: actual.despesas - planned.compromissos,
      sobraPrevista,
      saldoReal: actual.saldo,
      deltaSaldo: actual.saldo - sobraPrevista,
    }
  }
  else
  {
    saldoPartida = input.saldoPartidaOverride
      ?? resolveChainedSaldoPartida(input, input.monthOffset, ref)

    saldoAposCompromissos = saldoPartida + receitasPrevistas - compromissos
    sobraParaGastar = saldoAposCompromissos
  }

  const sugestaoGastoDiario = sobraParaGastar > 0
    ? sobraParaGastar / diasNoMes
    : null

  let tone: MonthOutlook['tone'] = 'ok'
  let headline = isFuture
    ? `Previsão para ${monthLabel}`
    : isPast
      ? `Fechamento · ${monthLabel}`
      : `Resumo de ${monthLabel}`

  let detail = ''

  if (isFuture)
  {
    if (sobraParaGastar < 0)
    {
      tone = 'urgent'
      detail = input.monthOffset > 1
        ? 'Projeção encadeada indica déficit neste mês. Revise fixas, faturas ou receitas recorrentes.'
        : 'Compromissos e receitas previstas indicam déficit. Revise fixas, faturas ou cadastre receitas recorrentes.'
    }
    else if (sobraParaGastar < compromissos * 0.15)
    {
      tone = 'caution'
      detail = 'Pouca margem após contas fixas e faturas. Priorize o essencial no início do mês.'
    }
    else if (orcamentoTotal > 0 && sobraParaGastar < orcamentoTotal)
    {
      tone = 'caution'
      detail = `Sobra abaixo do orçamento cadastrado (R$ ${orcamentoTotal.toFixed(2)}). Ajuste limites ou receitas.`
    }
    else
    {
      detail = receitasItens.length === 0
        ? 'Cadastre receitas recorrentes na Análise para afinar a previsão.'
        : input.monthOffset > 1
          ? 'Estimativa encadeada a partir dos meses anteriores — revise se algo mudar.'
          : 'Valor livre estimado após entradas e compromissos já conhecidos.'
    }
  }
  else if (comparison)
  {
    const absDelta = Math.abs(comparison.deltaSaldo)
    if (comparison.deltaSaldo < -100)
    {
      tone = 'urgent'
      detail = `Gastou ${fmtCurrency(absDelta)} a mais que o previsto (fixas + faturas + recorrentes).`
    }
    else if (comparison.deltaSaldo > 100)
    {
      tone = 'ok'
      detail = `Economizou ${fmtCurrency(absDelta)} em relação ao que estava planejado.`
    }
    else if (comparison.deltaCompromissos > 100)
    {
      tone = 'caution'
      detail = 'Despesas reais acima dos compromissos cadastrados — cadastre lançamentos ou ajuste fixas.'
    }
    else
    {
      detail = 'Comparativo entre o que estava cadastrado (recorrentes, fixas, faturas) e o que foi lançado.'
    }
  }

  return {
    monthLabel,
    monthOffset: input.monthOffset,
    isFuture,
    isPast,
    saldoPartida,
    receitasPrevistas,
    receitasItens,
    compromissos,
    compromissosItens,
    agendadosMes,
    saldoAposCompromissos,
    sobraParaGastar,
    sugestaoGastoDiario,
    diasNoMes,
    tone,
    headline,
    detail,
    comparison,
  }
}

function fmtCurrency(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Atalho — visão do mês seguinte em relação ao mês de referência */
export function buildNextMonthOutlook(
  input: Omit<MonthOutlookInput, 'monthOffset' | 'saldoPartidaOverride'>,
  baseOffset = 0,
  ref = new Date(),
): MonthOutlook
{
  return buildMonthOutlook({ ...input, monthOffset: baseOffset + 1 }, ref)
}
