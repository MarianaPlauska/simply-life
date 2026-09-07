import { Platform } from 'react-native'
import { create } from 'zustand'
import { localTodayIso } from '@simply-life/shared'

const KEY = 'simply-life-water-log'

type WaterLogState = {
  lastSipAt: string | null
  days: Record<string, number>
  recordSip: (cups: number) => void
  hydrate: () => void
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

function todayIso(): string
{
  return localTodayIso()
}

export const useWaterLogStore = create<WaterLogState>((set, get) => ({
  lastSipAt: null,
  days: {},

  hydrate: () =>
  {
    try
    {
      const raw = storage().getItem(KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as { lastSipAt?: string | null; days?: Record<string, number> }
      set({
        lastSipAt: parsed.lastSipAt ?? null,
        days: parsed.days ?? {},
      })
    }
    catch
    {
      /* log local inválido */
    }
  },

  recordSip: (cups) =>
  {
    const next = {
      lastSipAt: new Date().toISOString(),
      days: { ...get().days, [todayIso()]: cups },
    }
    set(next)
    storage().setItem(KEY, JSON.stringify(next))
  },
}))

export function minutesSinceSip(iso: string | null): number | null
{
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.round((Date.now() - then) / 60_000))
}
