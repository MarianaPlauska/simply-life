import { supabase } from './supabase'
import type { MonthSavingsGoal } from './financeMonthGoal'

export type MonthSpendGoalsMap = Record<string, { valorAlvo: number }>

export interface FinanceUserPrefs
{
  monthGoal?: MonthSavingsGoal | null
  monthSpendGoals?: MonthSpendGoalsMap
  incomeProfile?: { salarioBruto: number; updatedAt: string } | null
}

const LOCAL_KEY = 'simply-life-finance-user-prefs-cache'

export async function loadFinanceUserPrefs(): Promise<FinanceUserPrefs>
{
  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      const raw = localStorage.getItem(LOCAL_KEY)
      return raw ? JSON.parse(raw) as FinanceUserPrefs : {}
    }

    const { data, error } = await supabase
      .from('fin_user_prefs')
      .select('prefs')
      .eq('user_id', uid)
      .maybeSingle()

    if (error) throw error
    const prefs = (data?.prefs ?? {}) as FinanceUserPrefs
    localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs))
    return prefs
  }
  catch
  {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) as FinanceUserPrefs : {}
  }
}

export async function saveFinanceUserPrefs(patch: Partial<FinanceUserPrefs>): Promise<FinanceUserPrefs>
{
  const current = await loadFinanceUserPrefs()
  const merged = { ...current, ...patch }
  localStorage.setItem(LOCAL_KEY, JSON.stringify(merged))

  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return merged

    await supabase.from('fin_user_prefs').upsert({
      user_id: uid,
      prefs: merged,
      updated_at: new Date().toISOString(),
    })
  }
  catch
  {
    /* offline */
  }

  return merged
}
