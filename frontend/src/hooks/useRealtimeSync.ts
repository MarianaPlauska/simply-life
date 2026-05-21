// hook de realtime via supabase — substitui websocket do backend
import { useEffect } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import type { TarefaUnificada } from '../types'
import { supabase } from '../lib/supabase'

export function useRealtimeSync()
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)

  useEffect(() =>
  {
    if (!isLoggedIn) return

    // escuta mudanças em tarefas em tempo real
    const channel = supabase
      .channel('realtime-tarefas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tarefas_unificadas' },
        (payload) =>
        {
          useTaskStore.setState((s) =>
          {
            const exists = s.tarefas.some((t) => t.id === payload.new.id)
            if (exists) return s
            return { tarefas: [{ ...payload.new, subtarefas: [], labels: [] } as unknown as TarefaUnificada, ...s.tarefas] }
          })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tarefas_unificadas' },
        (payload) =>
        {
          useTaskStore.setState((s) => ({
            tarefas: s.tarefas.map((t) =>
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            ),
          }))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'tarefas_unificadas' },
        (payload) =>
        {
          useTaskStore.setState((s) => ({
            tarefas: s.tarefas.filter((t) => t.id !== payload.old.id),
          }))
        },
      )
      .subscribe()

    return () =>
    {
      supabase.removeChannel(channel)
    }
  }, [isLoggedIn])
}
