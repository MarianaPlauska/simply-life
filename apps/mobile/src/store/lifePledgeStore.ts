import { create } from 'zustand'
import { localTodayIso } from '@simply-life/shared'
import { isPersistReady, persistStorage, whenPersistReady } from '../lib/persistStorage'

export type LifePledge = {
  id: string
  title: string
  startedOn: string
  targetDays: number
  pinned: boolean
}

const KEY = 'simply-life-life-pledges'

export const LIFE_PLEDGE_KEYS = [KEY] as const

type LifePledgeState = {
  pledges: LifePledge[]
  hydrated: boolean
  hydrate: () => void
  add: (title: string, targetDays: number) => void
  restart: (id: string) => void
  remove: (id: string) => void
  pin: (id: string) => void
  reset: () => void
}

function read(): LifePledge[]
{
  try
  {
    const raw = persistStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LifePledge[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p) => p && typeof p.title === 'string' && typeof p.startedOn === 'string')
  }
  catch
  {
    return []
  }
}

function write(pledges: LifePledge[]): void
{
  persistStorage.setItem(KEY, JSON.stringify(pledges))
}

function commit(
  set: (partial: Partial<LifePledgeState>) => void,
  next: (current: LifePledge[]) => LifePledge[],
): void
{
  const apply = () =>
  {
    const pledges = next(read())
    write(pledges)
    set({ pledges, hydrated: true })
  }
  if (!isPersistReady())
  {
    void whenPersistReady().then(apply)
    return
  }
  apply()
}

export const useLifePledgeStore = create<LifePledgeState>((set, get) => ({
  pledges: [],
  hydrated: false,
  hydrate: () =>
  {
    if (!isPersistReady())
    {
      void whenPersistReady().then(() => get().hydrate())
      return
    }
    set({ pledges: read(), hydrated: true })
  },
  add: (title, targetDays) =>
  {
    const clean = title.trim().slice(0, 80)
    const days = Math.max(1, Math.min(3650, Math.floor(targetDays)))
    if (!clean) return
    commit(set, (current) => [
      {
        id: `p-${Date.now()}`,
        title: clean,
        startedOn: localTodayIso(),
        targetDays: days,
        pinned: current.length === 0,
      },
      ...current,
    ])
  },
  restart: (id) =>
  {
    commit(set, (current) => current.map((p) => (p.id === id ? { ...p, startedOn: localTodayIso() } : p)))
  },
  remove: (id) =>
  {
    commit(set, (current) =>
    {
      let pledges = current.filter((p) => p.id !== id)
      if (pledges.length > 0 && !pledges.some((p) => p.pinned))
      {
        pledges = pledges.map((p, i) => ({ ...p, pinned: i === 0 }))
      }
      return pledges
    })
  },
  pin: (id) =>
  {
    commit(set, (current) => current.map((p) => ({ ...p, pinned: p.id === id })))
  },
  reset: () =>
  {
    persistStorage.removeItem(KEY)
    set({ pledges: [], hydrated: true })
  },
}))
