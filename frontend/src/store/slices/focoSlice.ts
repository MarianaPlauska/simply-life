// slice de foco — timer pomodoro, gamificação via supabase
import type { StateCreator } from 'zustand'
import type { FocusState, GamificacaoProfile } from '../storeTypes'
import { supabase } from '../../lib/supabase'

export interface FocoSlice
{
  isFocusModeActive: boolean
  focusState: FocusState
  gamificacao: GamificacaoProfile
  startFocusSession: (taskId?: number) => void
  pauseFocusSession: () => void
  tickFocus: () => void
  syncFocusFromClock: () => void
  completeFocusPhase: () => Promise<void>
  resetFocus: () => void
  fetchGamificacao: () => Promise<void>
  finalizarSessaoFoco: (minutos: number, tarefaId?: number | null) => Promise<void>
}

// precisa acessar timerConfig do ui slice
type FullGet = () => FocoSlice & { timerConfig: { pomodoroTime: number; shortBreak: number; longBreak: number }; logout: () => void }

export const createFocoSlice: StateCreator<FocoSlice, [], [], FocoSlice> = (set, get) => ({
  isFocusModeActive: false,
  focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
  gamificacao: { xp: 0, xp_total: 0, streak_days: 0, streak_atual: 0, nivel: 0, ultima_sessao_foco: null, ultima_sessao_data: null },

  startFocusSession: (taskId) =>
  {
    const config = (get as unknown as FullGet)().timerConfig
    const secs = config.pomodoroTime * 60
    set({
      isFocusModeActive: true,
      focusState: {
        phase: 'focus',
        targetTaskId: taskId ?? null,
        secondsLeft: secs,
        totalSeconds: secs,
        sessionsCompleted: get().focusState.sessionsCompleted,
        endTimestampMs: Date.now() + secs * 1000,
      },
    })
  },

  pauseFocusSession: () =>
  {
    const fs = get().focusState
    set({ isFocusModeActive: fs.phase === 'focus' ? false : get().isFocusModeActive })
  },

  tickFocus: () =>
  {
    const fs = get().focusState
    if (!fs.endTimestampMs) return
    const remaining = Math.max(0, Math.round((fs.endTimestampMs - Date.now()) / 1000))
    set({ focusState: { ...fs, secondsLeft: remaining } })
  },

  syncFocusFromClock: () =>
  {
    const fs = get().focusState
    if (!fs.endTimestampMs || !get().isFocusModeActive) return
    const remaining = Math.max(0, Math.round((fs.endTimestampMs - Date.now()) / 1000))
    set({ focusState: { ...fs, secondsLeft: remaining } })
  },

  completeFocusPhase: async () =>
  {
    const fs = get().focusState
    const config = (get as unknown as FullGet)().timerConfig

    if (fs.phase === 'focus')
    {
      const newCount = fs.sessionsCompleted + 1
      await get().finalizarSessaoFoco(Math.round(fs.totalSeconds / 60), fs.targetTaskId)
      const breakTime = newCount % 4 === 0 ? config.longBreak : config.shortBreak
      const breakSecs = breakTime * 60
      set({
        focusState: {
          phase: 'break', targetTaskId: fs.targetTaskId,
          secondsLeft: breakSecs, totalSeconds: breakSecs,
          sessionsCompleted: newCount, endTimestampMs: Date.now() + breakSecs * 1000,
        },
      })
    }
    else if (fs.phase === 'break')
    {
      set({
        focusState: { ...fs, phase: 'completed', endTimestampMs: null },
        isFocusModeActive: false,
      })
    }
  },

  resetFocus: () =>
  {
    set({
      isFocusModeActive: false,
      focusState: { phase: 'idle', targetTaskId: null, secondsLeft: 0, totalSeconds: 0, sessionsCompleted: 0, endTimestampMs: null },
    })
  },

  fetchGamificacao: async () =>
  {
    try
    {
      // busca direto do profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('xp_total, streak_atual, ultima_sessao_data')
        .single()
      if (error) return
      set({
        gamificacao: {
          xp: profile.xp_total || 0, xp_total: profile.xp_total || 0,
          streak_days: profile.streak_atual || 0, streak_atual: profile.streak_atual || 0,
          nivel: Math.floor((profile.xp_total || 0) / 100),
          ultima_sessao_foco: profile.ultima_sessao_data,
          ultima_sessao_data: profile.ultima_sessao_data,
        },
      })
    }
    catch (e) { console.error('fetchGamificacao:', e) }
  },

  finalizarSessaoFoco: async (minutos, tarefaId) =>
  {
    try
    {
      // chama a db function que criamos
      const { data, error } = await supabase.rpc('finalizar_sessao_foco', {
        p_minutos: minutos,
        p_tarefa_id: tarefaId ?? null,
      })
      if (error) throw error
      if (data)
      {
        set({
          gamificacao: {
            xp: data.xp_total, xp_total: data.xp_total,
            streak_days: data.streak_atual, streak_atual: data.streak_atual,
            nivel: data.nivel,
            ultima_sessao_foco: new Date().toISOString(),
            ultima_sessao_data: new Date().toISOString(),
          },
        })
      }
    }
    catch (e) { console.error('finalizarSessaoFoco:', e) }
  },
})
