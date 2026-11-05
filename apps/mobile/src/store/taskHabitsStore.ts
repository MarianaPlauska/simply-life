import { create } from 'zustand'
import { localTodayIso, taskHabitTopic, type MobileTask, type TaskTopicStats } from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { useAuthStore } from './authStore'

const KEY = 'simply-life-task-habits-v1'
const MAX_EVENTS = 800
const WINDOW_DAYS = 120

type OutcomeEvent = {
  key: string
  topic: string
  outcome: 'completed' | 'left_for_later'
  at: string
}

type State = {
  events: OutcomeEvent[]
  hydrated: boolean
  owner: string | null
  hydrate: () => Promise<void>
  recordCompleted: (task: MobileTask, at?: Date) => Promise<void>
  recordLeftForLater: (task: MobileTask, dueDate: string, at?: Date) => Promise<void>
  topicStats: () => Record<string, TaskTopicStats>
}

const hydrations = new Map<string, Promise<void>>()

function currentOwner(): string
{
  const auth = useAuthStore.getState()
  return auth.userId ? `user-${auth.userId}` : auth.isGuest ? 'guest' : 'local'
}

function keyFor(owner: string): string
{
  return `${KEY}:${owner.replace(/[^A-Za-z0-9-]/g, '')}`
}

function save(owner: string, events: OutcomeEvent[]): void
{
  void writeLocalJson(keyFor(owner), events)
}

async function record(
  task: MobileTask,
  outcome: OutcomeEvent['outcome'],
  reference: string,
  at: Date,
  get: () => State,
  set: (partial: Partial<State>) => void,
): Promise<void>
{
  const owner = currentOwner()
  await get().hydrate()
  if (get().owner !== owner || currentOwner() !== owner) return
  const key = `${task.id}:${outcome}:${reference}`
  if (get().events.some((event) => event.key === key)) return
  const next = [...get().events, {
    key,
    topic: taskHabitTopic(task),
    outcome,
    at: at.toISOString(),
  }].slice(-MAX_EVENTS)
  set({ events: next })
  save(owner, next)
}

export const useTaskHabitsStore = create<State>((set, get) => ({
  events: [],
  hydrated: false,
  owner: null,
  hydrate: async () =>
  {
    const owner = currentOwner()
    if (get().hydrated && get().owner === owner) return
    let hydration = hydrations.get(owner)
    if (!hydration)
    {
      hydration = (async () =>
      {
        const saved = await readLocalJson<OutcomeEvent[]>(keyFor(owner))
        if (currentOwner() !== owner) return
        set({ owner, events: Array.isArray(saved) ? saved.filter((event) =>
          event && typeof event.key === 'string'
          && typeof event.topic === 'string'
          && (event.outcome === 'completed' || event.outcome === 'left_for_later')
          && typeof event.at === 'string') : [], hydrated: true })
      })()
      hydrations.set(owner, hydration)
    }
    await hydration
    if (hydrations.get(owner) === hydration) hydrations.delete(owner)
  },
  recordCompleted: async (task, at = new Date()) =>
  {
    await record(task, 'completed', localTodayIso(at), at, get, set)
  },
  recordLeftForLater: async (task, dueDate, at = new Date()) =>
  {
    await record(task, 'left_for_later', dueDate.slice(0, 10), at, get, set)
  },
  topicStats: () =>
  {
    if (get().owner !== currentOwner()) return {}
    const cutoff = Date.now() - WINDOW_DAYS * 86_400_000
    const stats: Record<string, TaskTopicStats> = {}
    for (const event of get().events)
    {
      if (new Date(event.at).getTime() < cutoff) continue
      const value = stats[event.topic] ?? { completed: 0, leftForLater: 0 }
      if (event.outcome === 'completed') value.completed += 1
      else value.leftForLater += 1
      stats[event.topic] = value
    }
    return stats
  },
}))
