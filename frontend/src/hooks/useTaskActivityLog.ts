import { useCallback, useEffect, useState } from 'react'

// Histórico automatizado — eventos funcionais do drawer

export type ActivityEventKind = 'blocker' | 'progress' | 'dependency' | 'rascunho'

export interface TaskActivityEntry
{
  id: string
  text: string
  kind?: ActivityEventKind
  createdAt: string
}

const STORAGE_KEY = 'axel-task-activity-v1'

function loadAll(): Record<string, TaskActivityEntry[]>
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, TaskActivityEntry[]>
  }
  catch
  {
    return {}
  }
}

function saveAll(data: Record<string, TaskActivityEntry[]>): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function useTaskActivityLog(taskId: number | null)
{
  const [entries, setEntries] = useState<TaskActivityEntry[]>([])

  useEffect(() =>
  {
    if (taskId === null)
    {
      setEntries([])
      return
    }

    const all = loadAll()
    setEntries(all[String(taskId)] ?? [])
  }, [taskId])

  const pushEntry = useCallback((entry: TaskActivityEntry) =>
  {
    if (!taskId) return

    setEntries((prev) =>
    {
      const next = [...prev, entry]
      const all = loadAll()
      all[String(taskId)] = next
      saveAll(all)
      return next
    })
  }, [taskId])

  const addEntry = useCallback((text: string, kind?: ActivityEventKind) =>
  {
    if (!text.trim()) return
    pushEntry({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      text: text.trim(),
      kind,
      createdAt: new Date().toISOString(),
    })
  }, [pushEntry])

  return { entries, addEntry }
}

/** Copia histórico do rascunho (-1) para a tarefa criada */
export function migrateTaskActivityLog(fromId: number, toId: number): void
{
  const all = loadAll()
  const from = all[String(fromId)] ?? []
  if (from.length === 0) return
  const existing = all[String(toId)] ?? []
  all[String(toId)] = [...from, ...existing]
  delete all[String(fromId)]
  saveAll(all)
}

export function appendTaskActivityLog(
  taskId: number,
  text: string,
  kind?: ActivityEventKind,
): void
{
  if (!text.trim()) return
  const all = loadAll()
  const list = all[String(taskId)] ?? []
  list.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text: text.trim(),
    kind,
    createdAt: new Date().toISOString(),
  })
  all[String(taskId)] = list
  saveAll(all)
}
