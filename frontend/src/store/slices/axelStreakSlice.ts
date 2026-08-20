import type { StateCreator } from 'zustand'
import { countAccountableMissedDays } from '../../lib/weekendStreak'
import type { ProofOfWorkEvaluation } from '../../lib/proofOfWork'
import {
  mergeOfensivaFromRow,
  pickOfensivaPayload,
  scheduleOfensivaPersist,
  type OfensivaStatsRow,
} from '../../lib/ofensivaSync'
import { supabase } from '../../lib/supabase'
import type { GamificacaoSlice } from './gamificacaoSlice'

// Ofensiva diária + heatmap de foco + escudos (retenção estilo GitHub)

const STREAK_FREEZE_COST = 500

export interface AxelStreakSlice
{
  streakCount: number
  lastActiveDate: string | null
  hasCompletedTaskToday: boolean
  hasWellbeingToday: boolean
  /** Abrir o resumo do dia já conta como check-in */
  hasDayCheckinToday: boolean
  /** Ausência não zera — a sequência espera o próximo check-in */
  streakPaused: boolean
  streakPulseNonce: number
  streakFreezes: number
  /** Dias em que a ofensiva foi salva (ISO date → true) */
  streakSavedDays: Record<string, boolean>
  /** Mês do último escudo grátis resgatado (YYYY-MM) */
  lastMonthlyFreezeClaim: string | null
  focusMinutesByDate: Record<string, number>

  syncStreakCalendarDay: () => void
  addDailyFocusMinutes: (minutes: number) => void
  isStreakSafeToday: () => boolean
  recordStreakOnTaskComplete: (
    proof: ProofOfWorkEvaluation,
  ) => { incremented: boolean; streakCount: number; streakQualified: boolean }
  recordWellbeingForStreak: () => { incremented: boolean; streakCount: number; streakQualified: boolean }
  recordDayCheckin: () => { incremented: boolean; streakCount: number; streakQualified: boolean }
  getTotalXp: () => number
  purchaseStreakFreeze: () => Promise<{ ok: boolean; message: string }>
  canClaimMonthlyStreakFreeze: () => boolean
  claimMonthlyStreakFreeze: () => { ok: boolean; message: string }
  hydrateOfensivaFromServer: (row: OfensivaStatsRow) => void
  syncOfensivaToServer: () => Promise<void>
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

interface StreakBumpResult
{
  incremented: boolean
  streakCount: number
  streakQualified: boolean
}

function currentMonthKey(): string
{
  return todayIsoDate().slice(0, 7)
}

function markStreakDaySaved(
  set: (partial: Partial<AxelStreakSlice> | ((s: AxelStreakSlice) => Partial<AxelStreakSlice>)) => void,
  get: () => AxelStreakSlice,
  day: string,
): void
{
  set({
    streakSavedDays: { ...get().streakSavedDays, [day]: true },
  })
}

function bumpDailyStreak(
  get: () => StreakStore,
  set: (partial: Partial<AxelStreakSlice> | ((s: AxelStreakSlice) => Partial<AxelStreakSlice>)) => void,
  flag: 'hasCompletedTaskToday' | 'hasWellbeingToday' | 'hasDayCheckinToday',
  onChanged?: () => void,
): StreakBumpResult
{
  get().syncStreakCalendarDay()

  const today = todayIsoDate()
  const yesterday = yesterdayIsoDate()
  const alreadySafe =
    get().hasCompletedTaskToday || get().hasWellbeingToday || get().hasDayCheckinToday

  if (alreadySafe)
  {
    set({ [flag]: true, streakPaused: false } as Partial<AxelStreakSlice>)
    markStreakDaySaved(set, get, today)
    onChanged?.()
    return {
      incremented: false,
      streakCount: get().streakCount,
      streakQualified: true,
    }
  }

  let nextStreak = 1
  const last = get().lastActiveDate
  const pausedCount = get().streakCount

  if (last === yesterday)
  {
    nextStreak = pausedCount + 1
  }
  else if (last === today)
  {
    nextStreak = pausedCount
  }
  else if (pausedCount > 0)
  {
    // Pausa: retoma a sequência em vez de recomeçar do zero
    nextStreak = pausedCount + 1
  }
  else
  {
    nextStreak = 1
  }

  set({
    streakCount: nextStreak,
    lastActiveDate: today,
    streakPaused: false,
    [flag]: true,
    streakPulseNonce: get().streakPulseNonce + 1,
    streakSavedDays: { ...get().streakSavedDays, [today]: true },
  } as Partial<AxelStreakSlice>)

  onChanged?.()

  return {
    incremented: true,
    streakCount: nextStreak,
    streakQualified: true,
  }
}

export const createAxelStreakSlice: StateCreator<
  StreakStore,
  [],
  [],
  AxelStreakSlice
> = (set, get) => ({
  streakCount: 0,
  lastActiveDate: null,
  hasCompletedTaskToday: false,
  hasWellbeingToday: false,
  hasDayCheckinToday: false,
  streakPaused: false,
  streakPulseNonce: 0,
  streakFreezes: 0,
  streakSavedDays: {},
  lastMonthlyFreezeClaim: null,
  focusMinutesByDate: {},

  hydrateOfensivaFromServer: (row) =>
  {
    const merged = mergeOfensivaFromRow(get(), row)
    set(merged)
    get().syncStreakCalendarDay()
  },

  syncOfensivaToServer: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const payload = pickOfensivaPayload(get())
      const { error } = await supabase
        .from('user_stats')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uid)

      if (error) throw error
    }
    catch (e)
    {
      console.error('syncOfensivaToServer:', e)
    }
  },

  syncStreakCalendarDay: () =>
  {
    const before = JSON.stringify(pickOfensivaPayload(get()))
    const today = todayIsoDate()
    const last = get().lastActiveDate

    const flush = () =>
    {
      if (JSON.stringify(pickOfensivaPayload(get())) !== before)
      {
        scheduleOfensivaPersist(() => get().syncOfensivaToServer())
      }
    }

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
        set({
          hasCompletedTaskToday: false,
          hasWellbeingToday: false,
          hasDayCheckinToday: false,
        })
      }
      flush()
      return
    }

    if (accountableGap === 1)
    {
      set({
        hasCompletedTaskToday: false,
        hasWellbeingToday: false,
        hasDayCheckinToday: false,
      })
      flush()
      return
    }

    if (get().streakFreezes > 0)
    {
      set({
        streakFreezes: get().streakFreezes - 1,
        lastActiveDate: yesterday,
        hasCompletedTaskToday: false,
        hasWellbeingToday: false,
        hasDayCheckinToday: false,
      })
      flush()
      return
    }

    set({
      streakPaused: true,
      hasCompletedTaskToday: false,
      hasWellbeingToday: false,
      hasDayCheckinToday: false,
    })

    flush()
  },

  isStreakSafeToday: () =>
    get().hasCompletedTaskToday || get().hasWellbeingToday || get().hasDayCheckinToday,

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
    scheduleOfensivaPersist(() => get().syncOfensivaToServer())
  },

  recordStreakOnTaskComplete: (proof) =>
  {
    if (!proof.qualifiesForStreak)
    {
      return {
        incremented: false,
        streakCount: get().streakCount,
        streakQualified: false,
      }
    }

    const onChanged = () => scheduleOfensivaPersist(() => get().syncOfensivaToServer())
    return bumpDailyStreak(get, set, 'hasCompletedTaskToday', onChanged)
  },

  recordWellbeingForStreak: () =>
  {
    const onChanged = () => scheduleOfensivaPersist(() => get().syncOfensivaToServer())
    return bumpDailyStreak(get, set, 'hasWellbeingToday', onChanged)
  },

  recordDayCheckin: () =>
  {
    const onChanged = () => scheduleOfensivaPersist(() => get().syncOfensivaToServer())
    return bumpDailyStreak(get, set, 'hasDayCheckinToday', onChanged)
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
    scheduleOfensivaPersist(() => get().syncOfensivaToServer())
    return { ok: true, message: 'Escudo de Ofensiva adquirido' }
  },

  canClaimMonthlyStreakFreeze: () =>
  {
    return get().lastMonthlyFreezeClaim !== currentMonthKey()
  },

  claimMonthlyStreakFreeze: () =>
  {
    const month = currentMonthKey()
    if (get().lastMonthlyFreezeClaim === month)
    {
      return { ok: false, message: 'Escudo grátis já resgatado neste mês' }
    }

    set({
      streakFreezes: get().streakFreezes + 1,
      lastMonthlyFreezeClaim: month,
    })
    scheduleOfensivaPersist(() => get().syncOfensivaToServer())
    return { ok: true, message: 'Escudo grátis do mês na mochila!' }
  },
})
