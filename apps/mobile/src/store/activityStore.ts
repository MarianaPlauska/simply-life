import { create } from 'zustand'
import { Platform } from 'react-native'
import { localTodayIso } from '@simply-life/shared'
import { useGamificationStore } from './gamificationStore'

const KEY = 'simply_life_activity_days_v1'

export type LifeActionKind = 'task' | 'note' | 'mood' | 'finance' | 'water' | 'focus'

export type ActivityDay = {
  opened: boolean
  actions: LifeActionKind[]
}

type PersistShape = Record<string, ActivityDay>

type State = {
  days: PersistShape
  hydrate: () => void
  markOpen: () => void
  markAction: (kind: LifeActionKind) => void
  seedDates: (isos: string[], kind: LifeActionKind) => void
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

function readDays(): PersistShape
{
  try
  {
    const raw = storage().getItem(KEY)
    return raw ? (JSON.parse(raw) as PersistShape) : {}
  }
  catch
  {
    return {}
  }
}

function writeDays(days: PersistShape)
{
  storage().setItem(KEY, JSON.stringify(days))
}

function ensureDay(days: PersistShape, iso: string): ActivityDay
{
  return days[iso] ?? { opened: false, actions: [] }
}

export const useActivityStore = create<State>((set, get) => ({
  days: {},

  hydrate: () =>
  {
    set({ days: readDays() })
  },

  markOpen: () =>
  {
    const iso = localTodayIso()
    const days = { ...get().days }
    const row = ensureDay(days, iso)
    if (row.opened) return
    days[iso] = { ...row, opened: true }
    writeDays(days)
    set({ days })
  },

  markAction: (kind) =>
  {
    const iso = localTodayIso()
    const days = { ...get().days }
    const row = ensureDay(days, iso)
    const firstAction = row.actions.length === 0
    const actions = row.actions.includes(kind) ? row.actions : [...row.actions, kind]
    days[iso] = { opened: true, actions }
    writeDays(days)
    set({ days })
    if (firstAction)
    {
      useGamificationStore.getState().bumpStreak()
    }
  },

  seedDates: (isos, kind) =>
  {
    const days = { ...get().days }
    let changed = false
    for (const raw of isos)
    {
      const iso = raw.slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) continue
      const row = ensureDay(days, iso)
      if (row.actions.includes(kind)) continue
      days[iso] = { opened: true, actions: [...row.actions, kind] }
      changed = true
    }
    if (!changed) return
    writeDays(days)
    set({ days })
  },
}))

export function actionIsos(days: PersistShape): string[]
{
  return Object.keys(days).filter((iso) => (days[iso]?.actions.length ?? 0) > 0)
}

export function openIsos(days: PersistShape): string[]
{
  return Object.keys(days).filter((iso) => days[iso]?.opened)
}
