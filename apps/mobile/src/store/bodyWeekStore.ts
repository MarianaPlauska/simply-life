import { Platform } from 'react-native'
import { create } from 'zustand'
import { localTodayIso, localIsoDaysAgo } from '@simply-life/shared'

const KEY = 'simply-life-body-week-v1'

type BodyWeekState = {
  sleepHours: Record<string, number>
  workout: Record<string, number>
  hydrate: () => void
  recordSleep: (hours: number) => void
  recordWorkout: (done: boolean) => void
  seedDemoIfEmpty: () => void
}

function storage()
{
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
  {
    return localStorage
  }
  const mem = new Map<string, string>()
  return {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) =>
    {
      mem.set(k, v)
    },
  }
}

function persist(state: Pick<BodyWeekState, 'sleepHours' | 'workout'>): void
{
  storage().setItem(KEY, JSON.stringify({ sleepHours: state.sleepHours, workout: state.workout }))
}

/** Série dos últimos 7 dias civis (hoje por último). */
export function last7Iso(): string[]
{
  return [6, 5, 4, 3, 2, 1, 0].map((d) => localIsoDaysAgo(d))
}

export const useBodyWeekStore = create<BodyWeekState>((set, get) => ({
  sleepHours: {},
  workout: {},

  hydrate: () =>
  {
    try
    {
      const raw = storage().getItem(KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { sleepHours?: Record<string, number>; workout?: Record<string, number> }
      set({
        sleepHours: parsed.sleepHours ?? {},
        workout: parsed.workout ?? {},
      })
    }
    catch
    {
      /* log local inválido */
    }
  },

  recordSleep: (hours) =>
  {
    const next = {
      sleepHours: { ...get().sleepHours, [localTodayIso()]: Math.max(0, Math.min(16, hours)) },
      workout: get().workout,
    }
    set(next)
    persist(next)
  },

  recordWorkout: (done) =>
  {
    const next = {
      sleepHours: get().sleepHours,
      workout: { ...get().workout, [localTodayIso()]: done ? 1 : 0 },
    }
    set(next)
    persist(next)
  },

  seedDemoIfEmpty: () =>
  {
    if (Object.keys(get().sleepHours).length > 0) return
    const sleepHours: Record<string, number> = {}
    const workout: Record<string, number> = {}
    const demoSleep = [6.5, 7, 8, 5.5, 7.5, 8, 7.3]
    const demoWo = [1, 0, 1, 1, 0, 1, 0]
    last7Iso().forEach((iso, i) =>
    {
      sleepHours[iso] = demoSleep[i] ?? 7
      workout[iso] = demoWo[i] ?? 0
    })
    const next = { sleepHours, workout }
    set(next)
    persist(next)
  },
}))
