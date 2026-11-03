import { create } from 'zustand'
import { habitMarkedCount, localTodayIso } from '@simply-life/shared'
import { isPersistReady, persistStorage, whenPersistReady } from '../lib/persistStorage'

export type HabitTrack = {
  id: string
  title: string
  marked: string[]
}

const KEY = 'simply-life-habit-tracks'

export const HABIT_TRACK_KEYS = [KEY] as const

type State = {
  habits: HabitTrack[]
  hydrate: () => void
  add: (title: string) => void
  toggleToday: (id: string) => void
  remove: (id: string) => void
  reset: () => void
}

function read(): HabitTrack[]
{
  try
  {
    const raw = persistStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as HabitTrack[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter((h) => h && typeof h.title === 'string' && Array.isArray(h.marked))
  }
  catch
  {
    return []
  }
}

function write(habits: HabitTrack[]): void
{
  persistStorage.setItem(KEY, JSON.stringify(habits))
}

function commit(set: (partial: Partial<State>) => void, next: (current: HabitTrack[]) => HabitTrack[]): void
{
  const apply = () =>
  {
    const habits = next(read())
    write(habits)
    set({ habits })
  }
  if (!isPersistReady())
  {
    void whenPersistReady().then(apply)
    return
  }
  apply()
}

export const useHabitTrackStore = create<State>((set, get) => ({
  habits: [],
  hydrate: () =>
  {
    if (!isPersistReady())
    {
      void whenPersistReady().then(() => get().hydrate())
      return
    }
    set({ habits: read() })
  },
  add: (title) =>
  {
    const clean = title.trim().slice(0, 60)
    if (!clean) return
    commit(set, (current) => [
      { id: `h-${Date.now()}`, title: clean, marked: [] },
      ...current,
    ])
  },
  toggleToday: (id) =>
  {
    const today = localTodayIso()
    commit(set, (current) => current.map((h) =>
    {
      if (h.id !== id) return h
      const has = h.marked.includes(today)
      const marked = has ? h.marked.filter((d) => d !== today) : [...h.marked, today]
      return { ...h, marked }
    }))
  },
  remove: (id) =>
  {
    commit(set, (current) => current.filter((h) => h.id !== id))
  },
  reset: () =>
  {
    persistStorage.removeItem(KEY)
    set({ habits: [] })
  },
}))

export function habitDays(marked: string[]): number
{
  return habitMarkedCount(marked)
}
