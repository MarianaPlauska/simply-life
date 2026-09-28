import { create } from 'zustand'
import { localTodayIso } from '@simply-life/shared'
import { isPersistReady, persistStorage, runHydrated, whenPersistReady } from '../lib/persistStorage'

const KEY = 'simply-life-water-log'

type WaterLogState = {
  lastSipAt: string | null
  days: Record<string, number>
  recordSip: (cups: number) => void
  hydrate: () => void
}

let loaded = false

function todayIso(): string
{
  return localTodayIso()
}

export const useWaterLogStore = create<WaterLogState>((set, get) => ({
  lastSipAt: null,
  days: {},

  hydrate: () =>
  {
    if (!isPersistReady())
    {
      void whenPersistReady().then(() => get().hydrate())
      return
    }
    loaded = true
    try
    {
      const raw = persistStorage.getItem(KEY)
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
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().recordSip(cups))) return
    const next = {
      lastSipAt: new Date().toISOString(),
      days: { ...get().days, [todayIso()]: cups },
    }
    set(next)
    persistStorage.setItem(KEY, JSON.stringify(next))
  },
}))

export function minutesSinceSip(iso: string | null): number | null
{
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  return Math.max(0, Math.round((Date.now() - then) / 60_000))
}
