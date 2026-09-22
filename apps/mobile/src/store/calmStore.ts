import { create } from 'zustand'
import {
  BOX_CYCLE_COUNT,
  BOX_PHASE_SEC,
  GROUNDING_STEPS,
  nextBoxPhase,
  type BoxBreathPhase,
  type CalmExerciseId,
} from '@simply-life/shared'
import { hapticBreathPulse } from '../lib/haptics'

type CalmStatus = 'idle' | 'active' | 'done'

type CalmState = {
  exerciseId: CalmExerciseId | null
  status: CalmStatus
  phase: BoxBreathPhase
  remainingSec: number
  running: boolean
  cycle: number
  stepIndex: number
  start: (id: CalmExerciseId) => void
  pause: () => void
  resume: () => void
  tick: () => void
  nextStep: () => void
  reset: () => void
}

const idle: Pick<
  CalmState,
  'exerciseId' | 'status' | 'phase' | 'remainingSec' | 'running' | 'cycle' | 'stepIndex'
> = {
  exerciseId: null,
  status: 'idle',
  phase: 'inhale',
  remainingSec: BOX_PHASE_SEC,
  running: false,
  cycle: 1,
  stepIndex: 0,
}

export const useCalmStore = create<CalmState>((set, get) => ({
  ...idle,

  start: (id) =>
  {
    if (id === 'box_breathing')
    {
      set({
        exerciseId: id,
        status: 'active',
        phase: 'inhale',
        remainingSec: BOX_PHASE_SEC,
        running: true,
        cycle: 1,
        stepIndex: 0,
      })
      hapticBreathPulse()
      return
    }
    set({
      exerciseId: id,
      status: 'active',
      phase: 'inhale',
      remainingSec: 0,
      running: false,
      cycle: 1,
      stepIndex: 0,
    })
  },

  pause: () => set({ running: false }),
  resume: () =>
  {
    if (get().status !== 'active') return
    set({ running: true })
  },

  tick: () =>
  {
    const { running, status, exerciseId, remainingSec, phase, cycle } = get()
    if (!running || status !== 'active' || exerciseId !== 'box_breathing') return
    if (remainingSec > 1)
    {
      set({ remainingSec: remainingSec - 1 })
      return
    }
    const next = nextBoxPhase(phase)
    const wrapped = next === 'inhale'
    if (wrapped && cycle >= BOX_CYCLE_COUNT)
    {
      set({ remainingSec: 0, running: false, status: 'done' })
      hapticBreathPulse()
      return
    }
    set({
      phase: next,
      cycle: wrapped ? cycle + 1 : cycle,
      remainingSec: BOX_PHASE_SEC,
    })
    hapticBreathPulse()
  },

  nextStep: () =>
  {
    const { exerciseId, status, stepIndex } = get()
    if (exerciseId !== 'grounding_54321' || status !== 'active') return
    if (stepIndex >= GROUNDING_STEPS.length - 1)
    {
      set({ status: 'done', stepIndex: GROUNDING_STEPS.length - 1 })
      return
    }
    set({ stepIndex: stepIndex + 1 })
  },

  reset: () => set({ ...idle }),
}))
