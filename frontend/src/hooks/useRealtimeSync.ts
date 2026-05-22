// Realtime Supabase — tarefas no Kanban/Superhuman sem F5
import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useTaskStore } from '../store/useTaskStore'
import { supabase } from '../lib/supabase'
import { mapTarefaFromRow } from '../utils/mapTarefaFromRow'

const EXTERNAL_ORIGINS = new Set([
  'webhook',
  'gmail',
  'gmail_triage',
  'gmail_mock',
  'gmail_api',
  'github_issue',
  'github_pr',
  'email',
  'google_cal',
  'meeting',
])

function isExternalOrigin(origem: string): boolean
{
  return EXTERNAL_ORIGINS.has(origem) || origem.includes('gmail') || origem.includes('github')
}

function notifyTriaged(titulo: string): void
{
  import('sonner').then(({ toast }) =>
  {
    toast.info('Jarvis: nova tarefa triada', { description: titulo })
  })
}

export function useRealtimeSync(): void
{
  const isLoggedIn = useTaskStore((s) => s.isLoggedIn)
  const setRealtimeStatus = useTaskStore((s) => s.setRealtimeStatus)
  const retryRef = useRef(0)

  useEffect(() =>
  {
    if (!isLoggedIn)
    {
      setRealtimeStatus('offline')
      return
    }

    let channel: RealtimeChannel | null = null
    let disposed = false

    const subscribe = async () =>
    {
      setRealtimeStatus('connecting')
      const { data: { user } } = await supabase.auth.getUser()
      const uid = user?.id
      if (!uid || disposed)
      {
        setRealtimeStatus('offline')
        return
      }

      const applyInsert = (row: Record<string, unknown>) =>
      {
        if (row.deletado_em) return

        const mapped = mapTarefaFromRow(row)
        useTaskStore.setState((s) =>
        {
          if (s.tarefas.some((t) => t.id === mapped.id)) return s
          const tarefas = [mapped, ...s.tarefas].sort((a, b) =>
          {
            const ta = new Date(a.created_at || 0).getTime()
            const tb = new Date(b.created_at || 0).getTime()
            return tb - ta
          })
          return { tarefas }
        })

        const origem = String(row.origem || '')
        if (isExternalOrigin(origem))
        {
          notifyTriaged(String(row.titulo || 'Item recebido'))
        }
      }

      const applyUpdate = (row: Record<string, unknown>) =>
      {
        if (row.deletado_em)
        {
          useTaskStore.setState((s) => ({
            tarefas: s.tarefas.filter((t) => t.id !== row.id),
          }))
          return
        }

        const mapped = mapTarefaFromRow(row)
        useTaskStore.setState((s) => ({
          tarefas: s.tarefas.map((t) => (t.id === mapped.id ? { ...t, ...mapped } : t)),
        }))
      }

      channel = supabase
        .channel(`realtime-tarefas-${uid}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'tarefas_unificadas',
            filter: `user_id=eq.${uid}`,
          },
          (payload) => applyInsert(payload.new as Record<string, unknown>),
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'tarefas_unificadas',
            filter: `user_id=eq.${uid}`,
          },
          (payload) => applyUpdate(payload.new as Record<string, unknown>),
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'tarefas_unificadas',
            filter: `user_id=eq.${uid}`,
          },
          (payload) =>
          {
            const oldRow = payload.old as { id?: number }
            if (!oldRow?.id) return
            useTaskStore.setState((s) => ({
              tarefas: s.tarefas.filter((t) => t.id !== oldRow.id),
            }))
          },
        )
        .subscribe((status) =>
        {
          if (disposed) return

          if (status === 'SUBSCRIBED')
          {
            retryRef.current = 0
            setRealtimeStatus('live')
          }
          else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
          {
            setRealtimeStatus('error')
            console.warn('[Realtime] Falha no canal — rode migration 011 e ative Realtime em tarefas_unificadas.')

            if (retryRef.current < 2)
            {
              retryRef.current += 1
              window.setTimeout(() =>
              {
                if (!disposed)
                {
                  if (channel) supabase.removeChannel(channel)
                  void subscribe()
                }
              }, 3000)
            }
          }
        })
    }

    void subscribe()

    return () =>
    {
      disposed = true
      if (channel) supabase.removeChannel(channel)
      setRealtimeStatus('offline')
    }
  }, [isLoggedIn, setRealtimeStatus])
}
