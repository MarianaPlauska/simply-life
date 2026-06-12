import { buildMonthOutlook } from './financeMonthOutlook'
import type {
  BudgetLimit,
  Category,
  ContaFixa,
  RecurringIncome,
  ReservedBill,
  Transaction,
} from '../store/storeTypes'

export interface MonthCloseRitual
{
  monthLabel: string
  monthOffset: number
  headline: string
  detail: string
  deltaSaldo: number | null
  deltaReceitas: number | null
  deltaCompromissos: number | null
  sugestaoLimite?: { categoria: string; valor: number }
  showRitual: boolean
}

export function isMonthCloseWindow(ref = new Date()): boolean
{
  const day = ref.getDate()
  const daysInMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  return day >= daysInMonth - 2 || day <= 5
}

export function buildMonthCloseRitual(input: {
  transactions: Transaction[]
  saldoInicial: number
  reservedBills: ReservedBill[]
  recurringIncomes: RecurringIncome[]
  contasFixas: ContaFixa[]
  budgetLimits: BudgetLimit[]
  categories: Category[]
  monthOffset?: number
  ref?: Date
}): MonthCloseRitual
{
  const ref = input.ref ?? new Date()
  const monthOffset = input.monthOffset ?? (ref.getDate() <= 5 ? -1 : 0)
  const outlook = buildMonthOutlook({
    ...input,
    monthOffset,
  })

  const cmp = outlook.comparison
  const showRitual = isMonthCloseWindow(ref) && Boolean(cmp)

  let headline = `Fechamento · ${outlook.monthLabel}`
  let detail = outlook.detail
  let sugestaoLimite: MonthCloseRitual['sugestaoLimite']

  if (cmp)
  {
    if (cmp.deltaSaldo < -50)
    {
      headline = 'Mês mais apertado que o previsto'
      detail = `Você gastou ${fmt(Math.abs(cmp.deltaSaldo))} a mais do que planejou. No próximo mês, segure variáveis nos primeiros 10 dias.`
    }
    else if (cmp.deltaSaldo > 50)
    {
      headline = 'Mês melhor que o previsto'
      detail = `Sobrou ${fmt(cmp.deltaSaldo)} vs previsão. Considere reforçar meta ou reserva.`
    }
    else
    {
      headline = 'Mês dentro do previsto'
      detail = 'Boa previsibilidade — mantenha o ritual de reconciliar com o banco toda semana.'
    }

    if (cmp.deltaCompromissos > 100)
    {
      const alvo = Math.ceil(cmp.compromissosReais * 1.05)
      sugestaoLimite = { categoria: 'compromissos_fixos', valor: alvo }
    }
  }

  return {
    monthLabel: outlook.monthLabel,
    monthOffset,
    headline,
    detail,
    deltaSaldo: cmp?.deltaSaldo ?? null,
    deltaReceitas: cmp?.deltaReceitas ?? null,
    deltaCompromissos: cmp?.deltaCompromissos ?? null,
    sugestaoLimite,
    showRitual,
  }
}

function fmt(v: number): string
{
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
