import { create } from 'zustand'

type FocusPhase = 'idle' | 'focus' | 'short' | 'long'

type FocusState = {
  phase: FocusPhase
  remainingSec: number
  running: boolean
  cycles: number
  start: (minutes: number, phase: FocusPhase) => void
  pause: () => void
  resume: () => void
  tick: () => void
  reset: () => void
}

export const useFocusStore = create<FocusState>((set, get) => ({
  phase: 'idle',
  remainingSec: 25 * 60,
  running: false,
  cycles: 0,

  start: (minutes, phase) =>
  {
    set({
      phase,
      remainingSec: Math.max(1, minutes) * 60,
      running: true,
    })
  },

  pause: () => set({ running: false }),
  resume: () => set({ running: true }),

  tick: () =>
  {
    const { remainingSec, running, phase, cycles } = get()
    if (!running) return
    if (remainingSec <= 1)
    {
      set({
        remainingSec: 0,
        running: false,
        phase: 'idle',
        cycles: phase === 'focus' ? cycles + 1 : cycles,
      })
      return
    }
    set({ remainingSec: remainingSec - 1 })
  },

  reset: () => set({ phase: 'idle', remainingSec: 25 * 60, running: false }),
}))
