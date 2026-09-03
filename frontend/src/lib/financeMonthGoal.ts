import type { Transaction } from '../store/storeTypes'
import { getCurrentMonthKey } from '../utils/rule503020'
import { loadFinanceUserPrefs, saveFinanceUserPrefs } from './financeUserPrefs'
import { dedupeTransactionsForLedger } from './financeTransactionDedup'

const STORAGE_KEY = 'simply-life-finance-month-goal'

export interface MonthSavingsGoal
{
  monthKey: string
  valorAlvo: number
  titulo?: string
}

export function loadMonthSavingsGoal(ref = new Date()): MonthSavingsGoal | null
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as MonthSavingsGoal
    if (typeof parsed.valorAlvo !== 'number' || parsed.valorAlvo <= 0) return null
    if (parsed.monthKey !== getCurrentMonthKey(ref)) return null
    return parsed
  }
  catch
  {
    return null
  }
}

export function saveMonthSavingsGoal(
  valorAlvo: number,
  titulo?: string,
  ref = new Date(),
): MonthSavingsGoal
{
  const goal: MonthSavingsGoal = {
    monthKey: getCurrentMonthKey(ref),
    valorAlvo,
    titulo: titulo?.trim() || 'Poupar este mês',
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goal))
  void saveFinanceUserPrefs({ monthGoal: goal })
  return goal
}

export async function hydrateMonthSavingsGoal(): Promise<MonthSavingsGoal | null>
{
  const prefs = await loadFinanceUserPrefs()
  const goal = prefs.monthGoal ?? null
  if (!goal || goal.monthKey !== getCurrentMonthKey()) return null
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goal))
  return goal
}

export function clearMonthSavingsGoal(): void
{
  localStorage.removeItem(STORAGE_KEY)
  void saveFinanceUserPrefs({ monthGoal: null })
}

export interface MonthGoalProgress
{
  poupado: number
  falta: number
  pct: number
  daysLeft: number
  lastDay: number
  pacePerDay: number | null
  onTrack: boolean
  paceMessage: string
}

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

/** Progresso da meta mensal - sobra do mês (receita − despesas) */
export function computeMonthGoalProgress(
  monthTx: Transaction[],
  valorAlvo: number,
  ref = new Date(),
): MonthGoalProgress
{
  const unique = dedupeTransactionsForLedger(monthTx)
  const receita = unique
    .filter((t) => t.tipo === 'receita')
    .reduce((s, t) => s + t.valor, 0)
  const despesas = unique
    .filter((t) => t.tipo === 'despesa')
    .reduce((s, t) => s + t.valor, 0)

  const poupado = Math.max(0, receita - despesas)
  const falta = Math.max(0, valorAlvo - poupado)
  const pct = valorAlvo > 0 ? Math.min(100, (poupado / valorAlvo) * 100) : 0

  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate()
  const daysLeft = Math.max(0, lastDay - ref.getDate())
  const pacePerDay = daysLeft > 0 && falta > 0 ? falta / daysLeft : null

  const dayOfMonth = ref.getDate()
  const expectedByNow = valorAlvo * (dayOfMonth / lastDay)
  const onTrack = poupado >= valorAlvo || poupado >= expectedByNow

  let paceMessage: string
  if (poupado >= valorAlvo)
  {
    paceMessage = 'Meta do mês alcançada!'
  }
  else if (daysLeft === 0)
  {
    paceMessage = falta > 0
      ? `Último dia - faltam ${fmt(falta)} para a meta.`
      : 'Fechando o mês no alvo.'
  }
  else if (!onTrack && pacePerDay != null)
  {
    paceMessage = `Acelere: ~${fmt(pacePerDay)}/dia nos próximos ${daysLeft} dias.`
  }
  else if (pacePerDay != null)
  {
    paceMessage = `No ritmo certo - ~${fmt(pacePerDay)}/dia até dia ${lastDay}.`
  }
  else
  {
    paceMessage = 'Cadastre receitas e despesas para acompanhar o progresso.'
  }

  return {
    poupado,
    falta,
    pct,
    daysLeft,
    lastDay,
    pacePerDay,
    onTrack,
    paceMessage,
  }
}
