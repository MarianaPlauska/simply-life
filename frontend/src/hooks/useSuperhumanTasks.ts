import { useMemo, useState } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import type { TarefaUnificada } from '../types'

export function useSuperhumanTasks()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const isLoading = useTaskStore((s) => s.isLoading)
  const fetchTarefas = useTaskStore((s) => s.fetchTarefas)
  const [searchQuery, setSearchQuery] = useState('')

  const activeTasks = useMemo(() =>
  {
    const q = searchQuery.trim().toLowerCase()
    return [...tarefas]
      .filter((t) => t.status !== 'concluida')
      .filter((t) =>
      {
        if (!q) return true
        return (
          t.titulo.toLowerCase().includes(q)
          || (t.notas_locais || '').toLowerCase().includes(q)
          || (t.snippet_100_char || '').toLowerCase().includes(q)
        )
      })
      .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
  }, [tarefas, searchQuery])

  return {
    activeTasks,
    isLoading,
    fetchTarefas,
    searchQuery,
    setSearchQuery,
  }
}

export type SuperhumanTask = TarefaUnificada
