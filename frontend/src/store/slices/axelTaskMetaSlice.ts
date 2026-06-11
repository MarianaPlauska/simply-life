import type { StateCreator } from 'zustand'

// Metadados locais de tarefa — lastMovedAt para decay

const LAST_MOVED_KEY = 'axel-task-last-moved-v1'

function loadLastMoved(): Record<number, string>
{
  try
  {
    const raw = localStorage.getItem(LAST_MOVED_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string>
    const out: Record<number, string> = {}
    for (const [k, v] of Object.entries(parsed))
    {
      out[Number(k)] = v
    }
    return out
  }
  catch
  {
    return {}
  }
}

function saveLastMoved(data: Record<number, string>): void
{
  const flat: Record<string, string> = {}
  for (const [id, iso] of Object.entries(data))
  {
    flat[String(id)] = iso
  }
  localStorage.setItem(LAST_MOVED_KEY, JSON.stringify(flat))
}

export interface AxelTaskMetaSlice
{
  taskLastMovedAt: Record<number, string>
  recordTaskMoved: (taskId: number) => void
  resolveLastMovedAt: (taskId: number, createdAt: string | null) => string | null
}

export const createAxelTaskMetaSlice: StateCreator<
  AxelTaskMetaSlice,
  [],
  [],
  AxelTaskMetaSlice
> = (set, get) => ({
  taskLastMovedAt: loadLastMoved(),

  recordTaskMoved: (taskId) =>
  {
    const iso = new Date().toISOString()
    set((s) =>
    {
      const next = { ...s.taskLastMovedAt, [taskId]: iso }
      saveLastMoved(next)
      return { taskLastMovedAt: next }
    })
  },

  resolveLastMovedAt: (taskId, createdAt) =>
  {
    const moved = get().taskLastMovedAt[taskId]
    if (moved) return moved
    return createdAt
  },
})
