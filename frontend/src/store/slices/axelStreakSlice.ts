import type { StateCreator } from 'zustand'
import { countAccountableMissedDays } from '../../lib/weekendStreak'
import type { ProofOfWorkEvaluation } from '../../lib/proofOfWork'
import type { GamificacaoSlice } from './gamificacaoSlice'

// Ofensiva diária + heatmap de foco + escudos (retenção estilo GitHub)

const STREAK_FREEZE_COST = 500

export interface AxelStreakSlice
{
  streakCount: number
  lastActiveDate: string | null
  hasCompletedTaskToday: boolean
  streakPulseNonce: number
  streakFreezes: number
  focusMinutesByDate: Record<string, number>

  syncStreakCalendarDay: () => void
  addDailyFocusMinutes: (minutes: number) => void
  recordStreakOnTaskComplete: (
    proof: ProofOfWorkEvaluation,
  ) => { incremented: boolean; streakCount: number; streakQualified: boolean }
  getTotalXp: () => number
  purchaseStreakFreeze: () => Promise<{ ok: boolean; message: string }>
}

function todayIsoDate(): string
{
  return new Date().toISOString().slice(0, 10)
}

function yesterdayIsoDate(): string
{
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

type StreakStore = AxelStreakSlice & Pick<GamificacaoSlice, 'userStats' | 'spendXp'>

export const createAxelStreakSlice: StateCreator<
  StreakStore,
  [],
  [],
  AxelStreakSlice
> = (set, get) => ({
  streakCount: 0,
  lastActiveDate: null,
  hasCompletedTaskToday: false,
  streakPulseNonce: 0,
  streakFreezes: 0,
  focusMinutesByDate: {},

  syncStreakCalendarDay: () =>
  {
    const today = todayIsoDate()
    const last = get().lastActiveDate

    if (!last)
    {
      return
    }

    if (last === today)
    {
      return
    }

    const yesterday = yesterdayIsoDate()
    const accountableGap = countAccountableMissedDays(last, today)

    if (accountableGap === 0)
    {
      if (last !== today)
      {
        set({ hasCompletedTaskToday: false })
      }
      return
    }

    if (accountableGap === 1)
    {
      set({ hasCompletedTaskToday: false })
      return
    }

    if (get().streakFreezes > 0)
    {
      set({
        streakFreezes: get().streakFreezes - 1,
        lastActiveDate: yesterday,
        hasCompletedTaskToday: false,
      })
      return
    }

    set({
      streakCount: 0,
      hasCompletedTaskToday: false,
    })
  },

  addDailyFocusMinutes: (minutes) =>
  {
    if (minutes <= 0) return
    const today = todayIsoDate()
    set((s) => ({
      focusMinutesByDate: {
        ...s.focusMinutesByDate,
        [today]: (s.focusMinutesByDate[today] ?? 0) + Math.round(minutes),
      },
    }))
  },

  recordStreakOnTaskComplete: (proof) =>
  {
    get().syncStreakCalendarDay()

    if (!proof.qualifiesForStreak)
    {
      return {
        incremented: false,
        streakCount: get().streakCount,
        streakQualified: false,
      }
    }

    const today = todayIsoDate()
    const yesterday = yesterdayIsoDate()

    if (get().hasCompletedTaskToday)
    {
      return {
        incremented: false,
        streakCount: get().streakCount,
        streakQualified: true,
      }
    }

    let nextStreak = 1
    const last = get().lastActiveDate

    if (last === yesterday)
    {
      nextStreak = get().streakCount + 1
    }
    else if (last === today)
    {
      nextStreak = get().streakCount
    }
    else
    {
      nextStreak = 1
    }

    set({
      streakCount: nextStreak,
      lastActiveDate: today,
      hasCompletedTaskToday: true,
      streakPulseNonce: get().streakPulseNonce + 1,
    })

    return {
      incremented: true,
      streakCount: nextStreak,
      streakQualified: true,
    }
  },

  getTotalXp: () =>
  {
    const stats = get().userStats
    if (!stats) return 0
    return (
      (stats.xp_foco ?? 0) +
      (stats.xp_vitalidade ?? 0) +
      (stats.xp_estabilidade ?? 0)
    )
  },

  purchaseStreakFreeze: async () =>
  {
    const total = get().getTotalXp()
    if (total < STREAK_FREEZE_COST)
    {
      return {
        ok: false,
        message: `XP insuficiente (${total}/${STREAK_FREEZE_COST})`,
      }
    }

    const spent = await get().spendXp(STREAK_FREEZE_COST)
    if (!spent)
    {
      return { ok: false, message: 'Não foi possível debitar XP' }
    }

    set({ streakFreezes: get().streakFreezes + 1 })
    return { ok: true, message: 'Escudo de Ofensiva adquirido' }
  },
})
