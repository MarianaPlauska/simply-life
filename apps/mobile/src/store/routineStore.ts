import { create } from 'zustand'
import { localTodayIso, type RoutineCadence, type RoutineHabit, type RoutineLogs } from '@simply-life/shared'
import { loadRoutines, saveRoutineItems, saveRoutineLogs } from '../lib/routinesPersist'
import { useActivityStore } from './activityStore'

type State = {
  items: RoutineHabit[]
  logs: RoutineLogs
  loaded: boolean
  hydrate: () => Promise<void>
  addHabit: (title: string, opts?: {
    parentId?: string | null
    cadence?: RoutineCadence
    dailyTarget?: number
    weeklyTarget?: number
    isGroup?: boolean
  }) => RoutineHabit | null
  remove: (id: string) => void
  update: (
    id: string,
    patch: Partial<Pick<RoutineHabit, 'title' | 'cadence' | 'dailyTarget' | 'weeklyTarget'>>,
  ) => void
  tick: (id: string, iso?: string) => void
  untick: (id: string, iso?: string) => void
  completeGroup: (parentId: string, iso?: string) => void
}

function uid(): string
{
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export const useRoutineStore = create<State>((set, get) => ({
  items: [],
  logs: {},
  loaded: false,

  hydrate: async () =>
  {
    const { items, logs } = await loadRoutines()
    set({ items, logs, loaded: true })
  },

  addHabit: (title, opts) =>
  {
    const label = title.trim()
    if (!label) return null
    const item: RoutineHabit = {
      id: uid(),
      title: label,
      parentId: opts?.parentId ?? null,
      isGroup: Boolean(opts?.isGroup),
      cadence: opts?.cadence ?? 'daily',
      dailyTarget: Math.max(1, opts?.dailyTarget ?? 1),
      weeklyTarget: Math.max(1, opts?.weeklyTarget ?? 7),
    }
    const items = [...get().items, item]
    set({ items })
    void saveRoutineItems(items)
    return item
  },

  update: (id, patch) =>
  {
    const items = get().items.map((h) =>
    {
      if (h.id !== id) return h
      return {
        ...h,
        ...patch,
        title: patch.title?.trim() ? patch.title.trim() : h.title,
        dailyTarget: patch.dailyTarget != null ? Math.max(1, patch.dailyTarget) : h.dailyTarget,
        weeklyTarget: patch.weeklyTarget != null ? Math.max(1, patch.weeklyTarget) : h.weeklyTarget,
      }
    })
    set({ items })
    void saveRoutineItems(items)
  },

  remove: (id) =>
  {
    const habit = get().items.find((h) => h.id === id)
    const drop = new Set<string>([id])
    if (habit?.isGroup)
    {
      get().items
        .filter((h) => h.parentId === id)
        .forEach((h) => drop.add(h.id))
    }
    const items = get().items.filter((h) => h.id !== id && h.parentId !== id)
    const logs = { ...get().logs }
    for (const rid of drop)
    {
      delete logs[rid]
    }
    set({ items, logs })
    void saveRoutineItems(items)
    void saveRoutineLogs(logs)
  },

  tick: (id, iso) =>
  {
    const day = iso ?? localTodayIso()
    const habit = get().items.find((h) => h.id === id)
    if (!habit || habit.isGroup) return
    const cap = habit.cadence === 'weekly' ? 1 : Math.max(1, habit.dailyTarget)
    const current = get().logs[id]?.[day] ?? 0
    if (current >= cap) return
    const logs: RoutineLogs = {
      ...get().logs,
      [id]: { ...get().logs[id], [day]: current + 1 },
    }
    set({ logs })
    void saveRoutineLogs(logs)
    useActivityStore.getState().markAction('task')
  },

  untick: (id, iso) =>
  {
    const day = iso ?? localTodayIso()
    const current = get().logs[id]?.[day] ?? 0
    if (current <= 0) return
    const logs: RoutineLogs = {
      ...get().logs,
      [id]: { ...get().logs[id], [day]: current - 1 },
    }
    set({ logs })
    void saveRoutineLogs(logs)
  },

  completeGroup: (parentId, iso) =>
  {
    const day = iso ?? localTodayIso()
    const kids = get().items.filter((h) => h.parentId === parentId && !h.isGroup)
    const logs: RoutineLogs = { ...get().logs }
    for (const kid of kids)
    {
      const cap = kid.cadence === 'weekly' ? 1 : Math.max(1, kid.dailyTarget)
      logs[kid.id] = { ...logs[kid.id], [day]: cap }
    }
    set({ logs })
    void saveRoutineLogs(logs)
    useActivityStore.getState().markAction('task')
  },
}))
