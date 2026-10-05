import type { StateCreator } from 'zustand'
import { calcularEloSite, eloHoje, fetchEloDiasSite, registrarEloDiaSite, type EloAcao } from '../../lib/eloCanonico'
import type { ProofOfWorkEvaluation } from '../../lib/proofOfWork'
import {
  mergeOfensivaFromRow,
  pickOfensivaPayload,
  scheduleOfensivaPersist,
  type OfensivaStatsRow,
} from '../../lib/ofensivaSync'
import { supabase } from '../../lib/supabase'
import type { GamificacaoSlice } from './gamificacaoSlice'

// Elo diário (mesma regra do app, lib/eloCanonico) + heatmap de foco.
// Sem pausa, escudo ou fim de semana congelado: o número é só o que aconteceu.

export interface AxelStreakSlice
{
  streakCount: number
  lastActiveDate: string | null
  hasCompletedTaskToday: boolean
  hasWellbeingToday: boolean
  /** Abriu o resumo do dia (não cumpre o dia do elo) */
  hasDayCheckinToday: boolean
  /** Sempre false: o elo não pausa mais (campo mantido por compatibilidade) */
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
  /** lê os dias reais do elo (elo_dias) e recalcula a sequência */
  loadEloDias: () => Promise<void>
  syncOfensivaToServer: () => Promise<void>
}

/** Dia local (antes era UTC: à noite no Brasil já virava o dia seguinte) */
function todayIsoDate(): string
{
  return eloHoje()
}

type StreakStore = AxelStreakSlice & Pick<GamificacaoSlice, 'userStats' | 'spendXp'>

interface StreakBumpResult
{
  incremented: boolean
  streakCount: number
  streakQualified: boolean
}

/** Recalcula a sequência só com os dias cumpridos de verdade. */
function eloFromSavedDays(saved: Record<string, boolean>): { streakCount: number; lastActiveDate: string | null }
{
  const elo = calcularEloSite(Object.keys(saved).filter((d) => saved[d]))
  return { streakCount: elo.atual, lastActiveDate: elo.ultimoDia }
}

function bumpDailyStreak(
  get: () => StreakStore,
  set: (partial: Partial<AxelStreakSlice> | ((s: AxelStreakSlice) => Partial<AxelStreakSlice>)) => void,
  flag: 'hasCompletedTaskToday' | 'hasWellbeingToday' | 'hasDayCheckinToday',
  onChanged?: () => void,
): StreakBumpResult
{
  get().syncStreakCalendarDay()

  // só abrir o resumo do dia não cumpre o dia
  if (flag === 'hasDayCheckinToday')
  {
    set({ hasDayCheckinToday: true })
    return { incremented: false, streakCount: get().streakCount, streakQualified: false }
  }

  const today = eloHoje()
  const before = get().streakCount
  const streakSavedDays = { ...get().streakSavedDays, [today]: true }
  const next = eloFromSavedDays(streakSavedDays)
  const acao: EloAcao = flag === 'hasCompletedTaskToday' ? 'task' : 'water'
  const firstToday = !get().streakSavedDays[today]

  set({
    ...next,
    streakSavedDays,
    streakPaused: false,
    [flag]: true,
    ...(next.streakCount > before ? { streakPulseNonce: get().streakPulseNonce + 1 } : {}),
  } as Partial<AxelStreakSlice>)
  if (firstToday) void registrarEloDiaSite(today, acao)
  onChanged?.()

  return {
    incremented: next.streakCount > before,
    streakCount: next.streakCount,
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
    void get().loadEloDias()
  },

  loadEloDias: async () =>
  {
    const dias = await fetchEloDiasSite()
    if (!dias) return
    // os dias do servidor (app e site) mandam; o que só este navegador marcou também vale
    const streakSavedDays: Record<string, boolean> = {}
    for (const d of dias) streakSavedDays[d] = true
    for (const [d, ok] of Object.entries(get().streakSavedDays)) if (ok) streakSavedDays[d] = true
    set({ streakSavedDays, ...eloFromSavedDays(streakSavedDays), streakPaused: false })
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

    // sempre recalcula só com dias de verdade (sem pausa, escudo ou fim de semana
    // congelado); um número antigo salvo no servidor não fica na tela
    const elo = eloFromSavedDays(get().streakSavedDays)
    if (last === today && elo.streakCount === get().streakCount) return
    set({
      ...elo,
      streakPaused: false,
      // dia novo: as marcas de hoje recomeçam
      ...(elo.lastActiveDate !== today
        ? { hasCompletedTaskToday: false, hasWellbeingToday: false, hasDayCheckinToday: false }
        : {}),
    })
    flush()
  },

  isStreakSafeToday: () =>
    get().hasCompletedTaskToday || get().hasWellbeingToday,

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

  // escudos saíram: o elo já tem um descanso automático por semana e não se compra dia
  purchaseStreakFreeze: async () => ({ ok: false, message: 'O elo já tem um descanso grátis por semana.' }),

  canClaimMonthlyStreakFreeze: () => false,

  claimMonthlyStreakFreeze: () => ({ ok: false, message: 'O elo já tem um descanso grátis por semana.' }),
})
