const RECON_STREAK_KEY = 'axel_fin_recon_streak'
const RECON_LAST_KEY = 'axel_fin_recon_last_day'
const DAILY_BRIEF_KEY = 'axel_fin_daily_brief_day'

function todayKey(ref = new Date()): string
{
  return ref.toISOString().slice(0, 10)
}

function yesterdayKey(ref = new Date()): string
{
  const d = new Date(ref)
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function wasDailyBriefSentToday(ref = new Date()): boolean
{
  try
  {
    return localStorage.getItem(DAILY_BRIEF_KEY) === todayKey(ref)
  }
  catch
  {
    return false
  }
}

export function markDailyBriefSent(ref = new Date()): void
{
  try
  {
    localStorage.setItem(DAILY_BRIEF_KEY, todayKey(ref))
  }
  catch { /* quota */ }
}

export function recordReconciliationStreak(alinhado: boolean, ref = new Date()): number
{
  if (!alinhado) return 0

  try
  {
    const today = todayKey(ref)
    const last = localStorage.getItem(RECON_LAST_KEY)
    let streak = Number(localStorage.getItem(RECON_STREAK_KEY) || '0')

    if (last === yesterdayKey(ref))
    {
      streak += 1
    }
    else if (last !== today)
    {
      streak = 1
    }

    localStorage.setItem(RECON_STREAK_KEY, String(streak))
    localStorage.setItem(RECON_LAST_KEY, today)
    return streak
  }
  catch
  {
    return 1
  }
}

export function getReconciliationStreak(): number
{
  try
  {
    return Number(localStorage.getItem(RECON_STREAK_KEY) || '0')
  }
  catch
  {
    return 0
  }
}
