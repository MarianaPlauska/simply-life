import { getCurrentMonthKey } from '../utils/rule503020'
import { loadFinanceUserPrefs, saveFinanceUserPrefs } from './financeUserPrefs'

const STORAGE_KEY = 'simply-life-finance-month-spend-goals'

export interface MonthSpendGoal
{
  monthKey: string
  valorAlvo: number
}

type SpendGoalMap = Record<string, { valorAlvo: number }>

function readMap(): SpendGoalMap
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SpendGoalMap
  }
  catch
  {
    return {}
  }
}

function writeMap(map: SpendGoalMap): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  void saveFinanceUserPrefs({ monthSpendGoals: map })
}

export function monthKeyFromOffset(monthOffset: number, ref = new Date()): string
{
  const d = new Date(ref.getFullYear(), ref.getMonth() + monthOffset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function loadMonthSpendGoal(monthKey: string): MonthSpendGoal | null
{
  const map = readMap()
  const row = map[monthKey]
  if (!row || row.valorAlvo <= 0) return null
  return { monthKey, valorAlvo: row.valorAlvo }
}

export function saveMonthSpendGoal(monthKey: string, valorAlvo: number): MonthSpendGoal
{
  const map = readMap()
  map[monthKey] = { valorAlvo: Math.max(0, valorAlvo) }
  writeMap(map)
  return { monthKey, valorAlvo: map[monthKey].valorAlvo }
}

export function clearMonthSpendGoal(monthKey: string): void
{
  const map = readMap()
  delete map[monthKey]
  writeMap(map)
}

export async function hydrateMonthSpendGoals(): Promise<SpendGoalMap>
{
  const prefs = await loadFinanceUserPrefs()
  const fromPrefs = prefs.monthSpendGoals
  if (fromPrefs && Object.keys(fromPrefs).length > 0)
  {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fromPrefs))
    return fromPrefs
  }
  return readMap()
}

/** Mês corrente — atalho */
export function loadCurrentMonthSpendGoal(ref = new Date()): MonthSpendGoal | null
{
  return loadMonthSpendGoal(getCurrentMonthKey(ref))
}
