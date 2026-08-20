import type { AxelStreakSlice } from '../store/slices/axelStreakSlice'

// Persistência da ofensiva em user_stats (Supabase)

export interface OfensivaStatsRow
{
  ofensiva_streak?: number | null
  ofensiva_last_active_date?: string | null
  ofensiva_freezes?: number | null
  ofensiva_freeze_claim_month?: string | null
  ofensiva_saved_days?: Record<string, boolean> | null
  ofensiva_focus_minutes?: Record<string, number> | null
  ofensiva_task_today?: boolean | null
  ofensiva_wellbeing_today?: boolean | null
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

export function pickOfensivaPayload(state: AxelStreakSlice): OfensivaStatsRow
{
  return {
    ofensiva_streak: state.streakCount,
    ofensiva_last_active_date: state.lastActiveDate,
    ofensiva_freezes: state.streakFreezes,
    ofensiva_freeze_claim_month: state.lastMonthlyFreezeClaim,
    ofensiva_saved_days: state.streakSavedDays,
    ofensiva_focus_minutes: state.focusMinutesByDate,
    ofensiva_task_today: state.hasCompletedTaskToday,
    ofensiva_wellbeing_today: state.hasWellbeingToday,
  }
}

export function mergeOfensivaFromRow(
  local: AxelStreakSlice,
  row: OfensivaStatsRow,
): Partial<AxelStreakSlice>
{
  const serverStreak = row.ofensiva_streak ?? 0
  const localStreak = local.streakCount
  const serverSaved = normalizeSavedDays(row.ofensiva_saved_days)
  const localSaved = local.streakSavedDays ?? {}
  const mergedSaved = { ...serverSaved, ...localSaved }

  const serverFocus = normalizeFocusMinutes(row.ofensiva_focus_minutes)
  const mergedFocus = { ...serverFocus, ...local.focusMinutesByDate }

  const useServerStreak = serverStreak >= localStreak
    || Boolean(row.ofensiva_last_active_date && row.ofensiva_last_active_date >= (local.lastActiveDate ?? ''))

  const serverLast = row.ofensiva_last_active_date ?? null
  const localLast = local.lastActiveDate
  const lastActiveDate = !serverLast
    ? localLast
    : !localLast
      ? serverLast
      : serverLast >= localLast
        ? serverLast
        : localLast

  return {
    streakCount: useServerStreak ? serverStreak : localStreak,
    lastActiveDate,
    streakFreezes: Math.max(row.ofensiva_freezes ?? 0, local.streakFreezes),
    lastMonthlyFreezeClaim: row.ofensiva_freeze_claim_month ?? local.lastMonthlyFreezeClaim,
    streakSavedDays: mergedSaved,
    focusMinutesByDate: mergedFocus,
    hasCompletedTaskToday: row.ofensiva_task_today ?? local.hasCompletedTaskToday,
    hasWellbeingToday: row.ofensiva_wellbeing_today ?? local.hasWellbeingToday,
  }
}

function normalizeSavedDays(raw: unknown): Record<string, boolean>
{
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>))
  {
    if (v) out[k] = true
  }
  return out
}

function normalizeFocusMinutes(raw: unknown): Record<string, number>
{
  if (!raw || typeof raw !== 'object') return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(raw as Record<string, unknown>))
  {
    const n = Number(v)
    if (!Number.isNaN(n) && n > 0) out[k] = Math.round(n)
  }
  return out
}

export function scheduleOfensivaPersist(run: () => Promise<void>): void
{
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() =>
  {
    persistTimer = null
    void run()
  }, 600)
}
