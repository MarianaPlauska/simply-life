import { useCallback, useEffect, useState } from 'react'
import { notifySubtasksChanged, readLocalSubtasks } from '../lib/subtaskProgress'
import type { Subtarefa } from '../types'

// Subtarefas locais para tarefas mock (id negativo) — checklist funcional sem Supabase

const STORAGE_KEY = 'orion-local-subtasks-v1'

export { readLocalSubtasks }

function loadAll(): Record<string, Subtarefa[]>
{
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, Subtarefa[]>
  }
  catch
  {
    return {}
  }
}

function loadForTask(taskId: number): Subtarefa[]
{
  return loadAll()[String(taskId)] ?? []
}

function saveAll(data: Record<string, Subtarefa[]>): void
{
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function nextLocalId(): number
{
  return -Math.floor(Date.now() + Math.random() * 1000)
}

export function useLocalSubtasks(taskId: number, serverSubs: Subtarefa[])
{
  const isLocal = taskId <= 0
  const [localSubs, setLocalSubs] = useState<Subtarefa[]>([])

  useEffect(() =>
  {
    if (!isLocal)
    {
      setLocalSubs([])
      return
    }
    setLocalSubs(loadForTask(taskId))
  }, [taskId, isLocal])

  const subs = isLocal ? localSubs : serverSubs

  const persist = useCallback((next: Subtarefa[]) =>
  {
    if (!isLocal) return
    const all = loadAll()
    all[String(taskId)] = next
    saveAll(all)
    setLocalSubs(next)
    notifySubtasksChanged(taskId)
  }, [isLocal, taskId])

  const addSub = useCallback((titulo: string) =>
  {
    const item: Subtarefa = {
      id: nextLocalId(),
      titulo,
      concluida: false,
      ordem: subs.length,
    }
    persist([...subs, item])
  }, [subs, persist])

  const toggleSub = useCallback((id: number) =>
  {
    persist(subs.map((s) => (s.id === id ? { ...s, concluida: !s.concluida } : s)))
  }, [subs, persist])

  const removeSub = useCallback((id: number) =>
  {
    persist(subs.filter((s) => s.id !== id))
  }, [subs, persist])

  return { subs, isLocal, addSub, toggleSub, removeSub }
}
