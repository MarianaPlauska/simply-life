import { useCallback, useEffect, useState } from 'react'
import type { Subtarefa } from '../types'

// Progresso de checklist — merge servidor + localStorage (mock)

const STORAGE_KEY = 'orion-local-subtasks-v1'
export const SUBTASKS_CHANGED_EVENT = 'orion-local-subtasks-changed'

export function readLocalSubtasks(taskId: number): Subtarefa[]
{
  if (taskId > 0) return []
  try
  {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const all = JSON.parse(raw) as Record<string, Subtarefa[]>
    return all[String(taskId)] ?? []
  }
  catch
  {
    return []
  }
}

export function notifySubtasksChanged(taskId: number): void
{
  window.dispatchEvent(
    new CustomEvent(SUBTASKS_CHANGED_EVENT, { detail: { taskId } }),
  )
}

export function calcSubtaskProgress(subs: Subtarefa[]): number
{
  if (subs.length === 0) return 0
  const done = subs.filter((s) => s.concluida).length
  return Math.round((done / subs.length) * 100)
}

export function resolveEffectiveSubtasks(
  taskId: number,
  serverSubs: Subtarefa[] | undefined,
): Subtarefa[]
{
  if (taskId <= 0) return readLocalSubtasks(taskId)
  return serverSubs ?? []
}

/** Reage em tempo real a toggles no drawer (local + store) */
export function useSubtaskProgress(taskId: number, serverSubs: Subtarefa[] | undefined)
{
  const read = useCallback(
    () => resolveEffectiveSubtasks(taskId, serverSubs),
    [taskId, serverSubs],
  )

  const [subs, setSubs] = useState<Subtarefa[]>(read)

  useEffect(() =>
  {
    setSubs(read())
  }, [read])

  useEffect(() =>
  {
    const onStorage = (e: StorageEvent) =>
    {
      if (e.key === STORAGE_KEY) setSubs(read())
    }
    const onCustom = (e: Event) =>
    {
      const detail = (e as CustomEvent<{ taskId: number }>).detail
      if (detail?.taskId === taskId) setSubs(read())
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(SUBTASKS_CHANGED_EVENT, onCustom)
    return () =>
    {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SUBTASKS_CHANGED_EVENT, onCustom)
    }
  }, [taskId, read])

  const percent = calcSubtaskProgress(subs)
  const done = subs.filter((s) => s.concluida).length

  return { subs, percent, done, total: subs.length }
}
