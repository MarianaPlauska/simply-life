import { create } from 'zustand'
import { flattenAcademySets, type AcademyExercise, type AcademySetStep } from '@simply-life/shared'

export type AcademyPhase = 'ready' | 'work' | 'rest' | 'done'

type ClockSlice = {
  phase: AcademyPhase
  stepIndex: number
  restLeft: number
  workLeft: number
  setElapsed: number
  elapsedSec: number
  startedAt: number | null
  setStartedAt: number | null
  phaseEndsAt: number | null
}

type AcademySessionState = ClockSlice & {
  plan: AcademyExercise[]
  setPlan: (plan: AcademyExercise[]) => void
  start: () => void
  completeSet: () => void
  skipRest: () => void
  tick: () => void
  reset: () => void
}

const IDLE: ClockSlice = {
  phase: 'ready',
  stepIndex: 0,
  restLeft: 0,
  workLeft: 0,
  setElapsed: 0,
  elapsedSec: 0,
  startedAt: null,
  setStartedAt: null,
  phaseEndsAt: null,
}

function sessionSteps(): AcademySetStep[]
{
  return flattenAcademySets(useAcademySessionStore.getState().plan)
}

function leftUntil(endsAt: number | null, now: number): number
{
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

function beginWork(stepIndex: number, now: number, startedAt: number): Partial<ClockSlice>
{
  const list = sessionSteps()
  if (stepIndex >= list.length)
  {
    return { ...IDLE, phase: 'done', stepIndex: list.length - 1, startedAt, elapsedSec: Math.floor((now - startedAt) / 1000) }
  }
  const step = list[stepIndex]
  const timed = step.workSec
  return {
    phase: 'work',
    stepIndex,
    restLeft: 0,
    workLeft: timed ?? 0,
    setElapsed: 0,
    setStartedAt: now,
    phaseEndsAt: timed ? now + timed * 1000 : null,
    startedAt,
    elapsedSec: Math.floor((now - startedAt) / 1000),
  }
}

function beginRest(stepIndex: number, restSec: number, now: number, startedAt: number): Partial<ClockSlice>
{
  return {
    phase: 'rest',
    stepIndex,
    restLeft: restSec,
    workLeft: 0,
    setElapsed: 0,
    setStartedAt: now,
    phaseEndsAt: now + restSec * 1000,
    startedAt,
    elapsedSec: Math.floor((now - startedAt) / 1000),
  }
}

export function academyCurrentStep(stepIndex: number): AcademySetStep | undefined
{
  return sessionSteps()[stepIndex]
}

export function academyNextStep(stepIndex: number): AcademySetStep | undefined
{
  return sessionSteps()[stepIndex + 1]
}

export const useAcademySessionStore = create<AcademySessionState>((set, get) => ({
  ...IDLE,
  plan: [],

  setPlan: (plan) => set({ plan }),

  start: () =>
  {
    if (sessionSteps().length === 0) return
    const now = Date.now()
    set({ ...beginWork(0, now, now) })
  },

  completeSet: () =>
  {
    const { phase, stepIndex, startedAt } = get()
    if (phase !== 'work') return
    const step = academyCurrentStep(stepIndex)
    if (!step) return
    const now = Date.now()
    const origin = startedAt ?? now
    if (step.restSec > 0)
    {
      set(beginRest(stepIndex, step.restSec, now, origin))
      return
    }
    set(beginWork(stepIndex + 1, now, origin))
  },

  skipRest: () =>
  {
    const { phase, stepIndex, startedAt } = get()
    if (phase !== 'rest') return
    const now = Date.now()
    set(beginWork(stepIndex + 1, now, startedAt ?? now))
  },

  tick: () =>
  {
    const s = get()
    if (s.phase === 'ready' || s.phase === 'done' || !s.startedAt) return
    const now = Date.now()
    const elapsedSec = Math.floor((now - s.startedAt) / 1000)
    const setElapsed = s.setStartedAt ? Math.floor((now - s.setStartedAt) / 1000) : 0

    if (s.phase === 'rest')
    {
      const restLeft = leftUntil(s.phaseEndsAt, now)
      if (restLeft <= 0)
      {
        set(beginWork(s.stepIndex + 1, now, s.startedAt))
        return
      }
      set({ restLeft, elapsedSec })
      return
    }

    if (s.phaseEndsAt)
    {
      const workLeft = leftUntil(s.phaseEndsAt, now)
      if (workLeft <= 0)
      {
        get().completeSet()
        return
      }
      set({ workLeft, elapsedSec, setElapsed })
      return
    }

    set({ elapsedSec, setElapsed })
  },

  reset: () => set({ ...IDLE }),
}))
