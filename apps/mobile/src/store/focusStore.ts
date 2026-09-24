import { create } from 'zustand'
import { useActivityStore } from './activityStore'
import { useFocusLogStore } from './focusLogStore'

type FocusPhase = 'idle' | 'focus' | 'short' | 'long'

type FocusState = {
  phase: FocusPhase
  remainingSec: number
  /** Duração total da sessão atual (para o anel) */
  durationSec: number
  running: boolean
  cycles: number
  /** Tarefa vinculada ao timer (ref app rosa) */
  targetTaskId: string | null
  /** Dispara +1 a cada sessão de foco concluída - UI consome para XP */
  completedFocusSessions: number
  /** segundos da sessão atual já gravados no histórico (evita contar duas vezes) */
  loggedSec: number
  /** grava o tempo real já feito na sessão atual (ao parar, trocar de tarefa ou concluir) */
  flush: () => void
  setTargetTask: (id: string | null) => void
  start: (minutes: number, phase: FocusPhase, taskId?: string | null) => void
  pause: () => void
  resume: () => void
  tick: () => void
  reset: (defaultMinutes?: number) => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  phase: 'idle',
  remainingSec: 25 * 60,
  durationSec: 25 * 60,
  running: false,
  cycles: 0,
  targetTaskId: null,
  completedFocusSessions: 0,
  loggedSec: 0,

  flush: () =>
  {
    const { phase, durationSec, remainingSec, loggedSec, targetTaskId } = get()
    if (phase !== 'focus') return
    const elapsed = durationSec - remainingSec - loggedSec
    // menos de 1 min não é sessão (foi só um toque no play)
    if (elapsed < 60) return
    useFocusLogStore.getState().record(targetTaskId, elapsed / 60)
    set({ loggedSec: loggedSec + elapsed })
  },

  setTargetTask: (id) =>
  {
    // o tempo feito até aqui pertence à tarefa anterior
    if (id !== get().targetTaskId) get().flush()
    set({ targetTaskId: id })
  },

  start: (minutes, phase, taskId) =>
  {
    get().flush()
    const durationSec = Math.max(1, minutes) * 60
    set({
      phase,
      remainingSec: durationSec,
      durationSec,
      running: true,
      loggedSec: 0,
      targetTaskId: taskId !== undefined ? taskId : get().targetTaskId,
    })
  },

  pause: () => set({ running: false }),
  resume: () => set({ running: true }),

  tick: () =>
  {
    const { remainingSec, running, phase, cycles, completedFocusSessions } = get()
    if (!running) return
    if (remainingSec <= 1)
    {
      const focusDone = phase === 'focus'
      if (focusDone)
      {
        useActivityStore.getState().markAction('focus')
        set({ remainingSec: 0 })
        get().flush()
      }
      set({
        remainingSec: 0,
        running: false,
        phase: 'idle',
        cycles: focusDone ? cycles + 1 : cycles,
        completedFocusSessions: focusDone
          ? completedFocusSessions + 1
          : completedFocusSessions,
        loggedSec: 0,
      })
      return
    }
    set({ remainingSec: remainingSec - 1 })
  },

  reset: (defaultMinutes = 25) =>
  {
    get().flush()
    const durationSec = Math.max(1, defaultMinutes) * 60
    set({
      loggedSec: 0,
      phase: 'idle',
      remainingSec: durationSec,
      durationSec,
      running: false,
    })
  },
}))
