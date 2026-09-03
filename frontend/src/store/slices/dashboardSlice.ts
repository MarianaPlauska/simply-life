// slice do dashboard - resumo, notificações, preferências via supabase
import type { StateCreator } from 'zustand'
import type { DashboardResumo, Notificacao } from '../storeTypes'
import { normalizeNotificacao } from '../../lib/notificacaoUtils'
import {
  completedBillReferenceKeys,
  isNotificationResolved,
  reconcileStaleNotifications,
} from '../../lib/notificationResolution'
import { supabase } from '../../lib/supabase'
import { normalizePinnedModules, type UISlice } from './uiSlice'

export interface DashboardSlice
{
  dashboardResumo: DashboardResumo | null
  dashboardLoading: boolean
  notificacoes: Notificacao[]
  fetchDashboard: () => Promise<void>
  fetchNotificacoes: () => Promise<void>
  markNotificacaoRead: (id: number) => Promise<void>
  markAllNotificacoesRead: () => Promise<void>
  fetchPreferencias: () => Promise<void>
  saveKeywords: (palavras: string[]) => Promise<void>
  simularIngestao: (params: { sender?: string; subject: string; body?: string; origem?: string }) => Promise<void>
}

// anti-flood
const _lastFetch: Record<string, number> = {}
function shouldFetch(key: string, interval = 2000): boolean
{
  const now = Date.now()
  if (now - (_lastFetch[key] || 0) < interval) return false
  _lastFetch[key] = now
  return true
}

export const createDashboardSlice: StateCreator<DashboardSlice & UISlice, [], [], DashboardSlice> = (set, get) => ({
  dashboardResumo: null,
  dashboardLoading: false,
  notificacoes: [],

  fetchDashboard: async () =>
  {
    if (!shouldFetch('dashboard')) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    set({ dashboardLoading: true })
    try
    {
      const { data, error } = await supabase.rpc('dashboard_resumo')
      if (error) throw error
      set({ dashboardResumo: data, dashboardLoading: false })
    }
    catch (e)
    {
      console.error('fetchDashboard:', e)
      set({ dashboardLoading: false })
    }
  },

  fetchNotificacoes: async () =>
  {
    if (!shouldFetch('notificacoes')) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try
    {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('criado_em', { ascending: false })
      if (error) throw error
      const rows = (data ?? []) as Record<string, unknown>[]
      let notificacoes = rows.map(normalizeNotificacao)

      const tarefas = (get() as { tarefas?: import('../../types').TarefaUnificada[] }).tarefas ?? []
      if (tarefas.length > 0)
      {
        await reconcileStaleNotifications(notificacoes, tarefas)
        const keys = completedBillReferenceKeys(tarefas)
        notificacoes = notificacoes.map((n) =>
          isNotificationResolved(n, tarefas, keys) ? { ...n, lida: true } : n,
        )
      }

      set({ notificacoes })
    }
    catch (e) { console.error('fetchNotificacoes:', e) }
  },

  markNotificacaoRead: async (id) =>
  {
    try
    {
      await supabase.from('notificacoes').update({ lida: 1 }).eq('id', id)
      set({ notificacoes: get().notificacoes.map((n) => n.id === id ? { ...n, lida: true } : n) })
    }
    catch (e) { console.error('markNotificacaoRead:', e) }
  },

  markAllNotificacoesRead: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      await supabase.from('notificacoes').update({ lida: 1 }).eq('user_id', uid).eq('lida', 0)
      set({ notificacoes: get().notificacoes.map((n) => ({ ...n, lida: true })) })
    }
    catch (e) { console.error('markAllNotificacoesRead:', e) }
  },

  fetchPreferencias: async () =>
  {
    if (!shouldFetch('preferencias')) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try
    {
      const { data, error } = await supabase
        .from('preferencias_usuario')
        .select('*')
        .maybeSingle()
      if (error) throw error
      if (data)
      {
        const kw = (data.palavras_chave_email || '').split(',').map((s: string) => s.trim()).filter(Boolean)
        get().setKeywords(kw)
        if (data.modulos_fixados)
        {
          const pins = String(data.modulos_fixados).split(',').map((s) => s.trim()).filter(Boolean)
          set({ pinnedModules: normalizePinnedModules(pins) })
        }
      }
    }
    catch { /* sem preferências ainda */ }
  },

  saveKeywords: async (palavras) =>
  {
    try
    {
      get().setKeywords(palavras)
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const joined = palavras.join(',')
      // upsert - cria ou atualiza
      const { error } = await supabase
        .from('preferencias_usuario')
        .upsert({ user_id: uid, palavras_chave_email: joined }, { onConflict: 'user_id' })
      if (error) throw error
      const { toast } = await import('sonner')
      toast.success('Keywords atualizadas!')
    }
    catch
    {
      const { toast } = await import('sonner')
      toast.error('Erro ao salvar keywords')
    }
  },

  simularIngestao: async (params) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { ingestTasksIA } = await import('../../services/jarvisApi')
      const response = await ingestTasksIA({
        items: [{
          sender: params.sender || 'Desconhecido',
          subject: params.subject,
          body: params.body || '',
          origem: params.origem || 'email',
        }],
      })
      const { toast } = await import('sonner')
      const result = response.results?.[0]
      if (result?.success)
      {
        toast.success(`Triagem concluída - Score: ${result.score_urgencia} (${result.prioridade})`)
      }
      else
      {
        toast.error('Erro na triagem: ' + (result?.error || 'desconhecido'))
      }
    }
    catch
    {
      const { toast } = await import('sonner')
      toast.error('Erro ao conectar com o motor de triagem')
    }
  },
})
