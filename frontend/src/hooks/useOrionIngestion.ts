import { useEffect, useRef } from 'react'
import { useTaskStore } from '../store/useTaskStore'

// Pipeline de ingestão — polling + highlight reativo no Kanban

const POLL_MS = 8_000
const HIGHLIGHT_MS = 4_200

interface UseOrionIngestionOptions
{
  enabled?: boolean
}

export function useOrionIngestion({ enabled = true }: UseOrionIngestionOptions = {})
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const pushIngestionHighlights = useTaskStore((s) => s.pushIngestionHighlights)
  const clearIngestionHighlights = useTaskStore((s) => s.clearIngestionHighlights)
  const setOrionIngestionPolling = useTaskStore((s) => s.setOrionIngestionPolling)
  const highlightIds = useTaskStore((s) => s.orionIngestionHighlightIds)

  const knownIdsRef = useRef<Set<number>>(new Set())
  const bootstrappedRef = useRef(false)

  useEffect(() =>
  {
    if (!enabled || !isLoggedIn)
    {
      setOrionIngestionPolling(false)
      return
    }

    let disposed = false

    const poll = async () =>
    {
      if (disposed) return

      const prev = knownIdsRef.current
      await fetchTarefas()

      const tarefas = useTaskStore.getState().tarefas
      const newIds: number[] = []

      for (const t of tarefas)
      {
        if (t.id <= 0) continue
        if (!prev.has(t.id) && bootstrappedRef.current)
        {
          newIds.push(t.id)
        }
        prev.add(t.id)
      }

      bootstrappedRef.current = true

      if (newIds.length > 0)
      {
        pushIngestionHighlights(newIds)
        const { toast } = await import('sonner')
        toast.info('Nova demanda ingerida', {
          description: `${newIds.length} tarefa(s) na fila de orquestração`,
        })
      }
    }

    setOrionIngestionPolling(true)
    void poll()
    const intervalId = window.setInterval(() => void poll(), POLL_MS)

    return () =>
    {
      disposed = true
      window.clearInterval(intervalId)
      setOrionIngestionPolling(false)
    }
  }, [
    enabled,
    isLoggedIn,
    fetchTarefas,
    pushIngestionHighlights,
    setOrionIngestionPolling,
  ])

  useEffect(() =>
  {
    if (highlightIds.length === 0) return

    const timerId = window.setTimeout(() =>
    {
      clearIngestionHighlights()
    }, HIGHLIGHT_MS)

    return () => window.clearTimeout(timerId)
  }, [highlightIds, clearIngestionHighlights])

  return { highlightIds }
}
