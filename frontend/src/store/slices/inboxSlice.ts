// slice de inbox unificado — unified_events do Supabase
import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'

export interface UnifiedEvent
{
  id: string
  source: 'gmail' | 'teams' | 'calendar' | 'manual' | 'whatsapp'
  sender: string | null
  raw_subject: string | null
  raw_body: string | null
  raw_language: string
  resumo: string | null
  acao_sugerida: 'responder' | 'fazer' | 'agendar' | 'ignorar' | null
  score_urgencia: number
  keywords_detectadas: string[]
  tarefa_id: number | null
  processed: boolean
  dismissed: boolean
  created_at: string
  processed_at: string | null
}

export interface InboxSlice
{
  inboxEvents: UnifiedEvent[]
  inboxLoading: boolean
  fetchInbox: () => Promise<void>
  dismissEvent: (id: string) => Promise<void>
  createTaskFromEvent: (id: string) => Promise<void>
  addManualEvent: (source: string, sender: string, subject: string, body: string) => Promise<void>
}

export const createInboxSlice: StateCreator<InboxSlice, [], [], InboxSlice> = (set, get) => ({
  inboxEvents: [],
  inboxLoading: false,

  fetchInbox: async () =>
  {
    set({ inboxLoading: true })
    try
    {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { set({ inboxLoading: false }); return }

      const { data, error } = await supabase
        .from('unified_events')
        .select('*')
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      set({ inboxEvents: (data || []) as UnifiedEvent[], inboxLoading: false })
    }
    catch (e)
    {
      console.error('fetchInbox:', e)
      set({ inboxLoading: false })
    }
  },

  dismissEvent: async (id) =>
  {
    try
    {
      await supabase.from('unified_events').update({ dismissed: true }).eq('id', id)
      set((s) => ({ inboxEvents: s.inboxEvents.filter((e) => e.id !== id) }))
    }
    catch (e) { console.error('dismissEvent:', e) }
  },

  createTaskFromEvent: async (id) =>
  {
    try
    {
      const event = get().inboxEvents.find((e) => e.id === id)
      if (!event) return

      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      // cria a tarefa
      const { data: tarefa } = await supabase
        .from('tarefas_unificadas')
        .insert({
          user_id: uid,
          titulo: event.resumo || event.raw_subject || 'Tarefa do inbox',
          descricao: `De: ${event.sender}\nOrigem: ${event.source}\n\n${event.raw_body?.substring(0, 300) || ''}`,
          origem: event.source,
          status: 'pendente',
          prioridade: event.score_urgencia >= 80 ? 'critica' : event.score_urgencia >= 50 ? 'alta' : 'media',
          score_urgencia: event.score_urgencia,
        })
        .select('id')
        .single()

      // atualiza o evento com a referência da tarefa
      if (tarefa)
      {
        await supabase
          .from('unified_events')
          .update({ processed: true, tarefa_id: tarefa.id, processed_at: new Date().toISOString() })
          .eq('id', id)
      }

      set((s) => ({
        inboxEvents: s.inboxEvents.map((e) =>
          e.id === id ? { ...e, processed: true, tarefa_id: tarefa?.id || null } : e
        )
      }))
    }
    catch (e) { console.error('createTaskFromEvent:', e) }
  },

  addManualEvent: async (source, sender, subject, body) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('unified_events')
        .insert({
          user_id: uid,
          source,
          sender,
          raw_subject: subject,
          raw_body: body,
          processed: false,
          dismissed: false,
        })
        .select()
        .single()

      if (error) throw error
      if (data) set((s) => ({ inboxEvents: [data as UnifiedEvent, ...s.inboxEvents] }))
    }
    catch (e) { console.error('addManualEvent:', e) }
  },
})
