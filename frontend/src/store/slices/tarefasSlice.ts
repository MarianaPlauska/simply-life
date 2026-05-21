// slice de tarefas — crud, subtarefas, labels, templates via supabase
import type { StateCreator } from 'zustand'
import type { TarefaUnificada, Label, Subtarefa } from '../../types'
import { supabase } from '../../lib/supabase'

export interface TarefasSlice
{
  tarefas: TarefaUnificada[]
  isLoading: boolean
  error: string | null
  labels: Label[]
  arquivo: TarefaUnificada[]
  arquivoLoading: boolean
  fetchTarefas: () => Promise<void>
  createTarefa: (titulo: string, notas?: string) => Promise<void>
  updateTarefa: (id: number, dados: { titulo?: string; status?: string; notas_locais?: string; prioridade?: string; versao?: number; score_urgencia?: number }) => Promise<void>
  deleteTarefa: (id: number) => Promise<void>
  moveTask: (taskId: number, newStatus: string) => void
  simularIngestao: (params: { sender?: string; subject: string; body?: string; origem?: string }) => Promise<void>
  duplicateTarefa: (id: number) => Promise<void>
  fetchArquivo: () => Promise<void>
  restaurarTarefa: (id: number) => Promise<void>
  batchMove: (ids: number[], status: string) => Promise<void>
  batchDelete: (ids: number[]) => Promise<void>
  batchPriority: (ids: number[], prioridade: string) => Promise<void>
  fetchLabels: () => Promise<void>
  createLabel: (nome: string, cor?: string) => Promise<void>
  deleteLabel: (id: number) => Promise<void>
  createSubtarefa: (tarefaId: number, titulo: string) => Promise<void>
  updateSubtarefa: (id: number, dados: Partial<Subtarefa>) => Promise<void>
  deleteSubtarefa: (id: number, tarefaId: number) => Promise<void>
  addLabelToTarefa: (tarefaId: number, labelId: number) => Promise<void>
  removeLabelFromTarefa: (tarefaId: number, labelId: number) => Promise<void>
  reorderSubtarefas: (tarefaId: number, orderedIds: number[]) => void
  templates: { id: number; nome: string; prioridade: string; subtarefas: string[] }[]
  fetchTemplates: () => Promise<void>
  createTemplate: (nome: string, prioridade: string, subtarefas: string[]) => Promise<void>
  deleteTemplate: (id: number) => Promise<void>
  applyTemplate: (templateId: number) => Promise<void>
}

export const createTarefasSlice: StateCreator<TarefasSlice, [], [], TarefasSlice> = (set, get) => ({
  tarefas: [],
  isLoading: false,
  error: null,
  labels: [] as Label[],
  arquivo: [],
  arquivoLoading: false,
  templates: [],

  fetchTarefas: async () =>
  {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    set({ isLoading: true, error: null })
    try
    {
      const { data, error } = await supabase
        .from('tarefas_unificadas')
        .select('*, subtarefas(*), tarefa_labels(label_id, labels(*))')
        .is('deletado_em', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      // mapeia labels do formato join para array plano
      const tarefas = (data || []).map((t: any) => ({
        ...t,
        labels: (t.tarefa_labels || []).map((tl: any) => tl.labels).filter(Boolean),
      }))
      set({ tarefas, isLoading: false })
    }
    catch (e)
    {
      set({ error: (e as Error).message, isLoading: false })
    }
  },

  createTarefa: async (titulo, notas) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from('tarefas_unificadas')
        .insert({ user_id: uid, titulo, notas_locais: notas || null })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ tarefas: [{ ...data, subtarefas: [], labels: [] }, ...s.tarefas] }))
    }
    catch (e) { console.error('createTarefa:', e) }
  },

  updateTarefa: async (id, dados) =>
  {
    try
    {
      const { data, error } = await supabase
        .from('tarefas_unificadas')
        .update(dados)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ tarefas: s.tarefas.map((t) => t.id === id ? { ...t, ...data } : t) }))
    }
    catch (e) { console.error('updateTarefa:', e) }
  },

  deleteTarefa: async (id) =>
  {
    try
    {
      // soft delete
      await supabase.from('tarefas_unificadas').update({ deletado_em: new Date().toISOString() }).eq('id', id)
      set((s) => ({ tarefas: s.tarefas.filter((t) => t.id !== id) }))
    }
    catch (e) { console.error('deleteTarefa:', e) }
  },

  moveTask: (taskId, newStatus) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        t.id === taskId ? { ...t, status: newStatus as TarefaUnificada['status'] } : t
      ),
    }))
    supabase.from('tarefas_unificadas').update({ status: newStatus }).eq('id', taskId).then(() => {})
  },

  simularIngestao: async (params) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { ingestTasksIA } = await import('../../services/jarvisApi')
      await ingestTasksIA({
        user_id: uid,
        items: [{
          sender: params.sender || 'Desconhecido',
          subject: params.subject,
          body: params.body || '',
          origem: params.origem || 'email',
        }],
      })
      // recarrega tarefas do banco para pegar a nova com score calculado
      get().fetchTarefas()
    }
    catch (e) { console.error('simularIngestao:', e) }
  },

  // ── labels ──
  fetchLabels: async () =>
  {
    try
    {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data, error } = await supabase.from('labels').select('*')
      if (error) throw error
      set({ labels: data || [] })
    }
    catch (e) { console.error('fetchLabels:', e) }
  },

  createLabel: async (nome, cor = '#8b5cf6') =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase.from('labels').insert({ user_id: uid, nome, cor }).select().single()
      if (error) throw error
      if (data) set((s) => ({ labels: [...s.labels, data] }))
    }
    catch (e) { console.error('createLabel:', e) }
  },

  deleteLabel: async (id) =>
  {
    try
    {
      await supabase.from('labels').delete().eq('id', id)
      set((s) => ({ labels: s.labels.filter((l) => l.id !== id) }))
    }
    catch (e) { console.error('deleteLabel:', e) }
  },

  // ── subtarefas ──
  createSubtarefa: async (tarefaId, titulo) =>
  {
    try
    {
      const { data, error } = await supabase
        .from('subtarefas')
        .insert({ tarefa_id: tarefaId, titulo })
        .select()
        .single()
      if (error) throw error
      if (data)
      {
        set((s) => ({
          tarefas: s.tarefas.map((t) =>
            t.id === tarefaId ? { ...t, subtarefas: [...(t.subtarefas || []), data] } : t
          ),
        }))
      }
    }
    catch (e) { console.error('createSubtarefa:', e) }
  },

  updateSubtarefa: async (id, dados) =>
  {
    try
    {
      const { data, error } = await supabase.from('subtarefas').update(dados).eq('id', id).select().single()
      if (error) throw error
      if (data)
      {
        set((s) => ({
          tarefas: s.tarefas.map((t) => ({
            ...t,
            subtarefas: (t.subtarefas || []).map((sub) => sub.id === id ? { ...sub, ...data } : sub),
          })),
        }))
      }
    }
    catch (e) { console.error('updateSubtarefa:', e) }
  },

  deleteSubtarefa: async (id, tarefaId) =>
  {
    try
    {
      await supabase.from('subtarefas').delete().eq('id', id)
      set((s) => ({
        tarefas: s.tarefas.map((t) =>
          t.id === tarefaId ? { ...t, subtarefas: (t.subtarefas || []).filter((sub) => sub.id !== id) } : t
        ),
      }))
    }
    catch (e) { console.error('deleteSubtarefa:', e) }
  },

  addLabelToTarefa: async (tarefaId, labelId) =>
  {
    try
    {
      await supabase.from('tarefa_labels').insert({ tarefa_id: tarefaId, label_id: labelId })
      get().fetchTarefas()
    }
    catch (e) { console.error('addLabelToTarefa:', e) }
  },

  removeLabelFromTarefa: async (tarefaId, labelId) =>
  {
    try
    {
      await supabase.from('tarefa_labels').delete().eq('tarefa_id', tarefaId).eq('label_id', labelId)
      set((s) => ({
        tarefas: s.tarefas.map((t) =>
          t.id === tarefaId ? { ...t, labels: (t.labels || []).filter((l) => l.id !== labelId) } : t
        ),
      }))
    }
    catch (e) { console.error('removeLabelFromTarefa:', e) }
  },

  // ── C4: duplicar tarefa ──
  duplicateTarefa: async (id) =>
  {
    try
    {
      const original = get().tarefas.find((t) => t.id === id)
      if (!original) return
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from('tarefas_unificadas')
        .insert({
          user_id: uid,
          titulo: `${original.titulo} (cópia)`,
          descricao: original.descricao,
          prioridade: original.prioridade,
          status: 'pendente',
          notas_locais: original.notas_locais,
        })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ tarefas: [{ ...data, subtarefas: [], labels: [] }, ...s.tarefas] }))
    }
    catch (e) { console.error('duplicateTarefa:', e) }
  },

  // ── C6: arquivo ──
  fetchArquivo: async () =>
  {
    set({ arquivoLoading: true })
    try
    {
      const { data, error } = await supabase
        .from('tarefas_unificadas')
        .select('*')
        .not('deletado_em', 'is', null)
        .order('deletado_em', { ascending: false })
      if (error) throw error
      set({ arquivo: data || [], arquivoLoading: false })
    }
    catch (e)
    {
      console.error('fetchArquivo:', e)
      set({ arquivoLoading: false })
    }
  },

  restaurarTarefa: async (id) =>
  {
    try
    {
      const { data, error } = await supabase
        .from('tarefas_unificadas')
        .update({ deletado_em: null, status: 'pendente' })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      if (data)
      {
        set((s) => ({
          arquivo: s.arquivo.filter((t) => t.id !== id),
          tarefas: [{ ...data, subtarefas: [], labels: [] }, ...s.tarefas],
        }))
      }
    }
    catch (e) { console.error('restaurarTarefa:', e) }
  },

  // ── C3: batch actions ──
  batchMove: async (ids, status) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        ids.includes(t.id) ? { ...t, status: status as TarefaUnificada['status'] } : t
      ),
    }))
    await Promise.allSettled(
      ids.map((id) => supabase.from('tarefas_unificadas').update({ status }).eq('id', id))
    )
  },

  batchDelete: async (ids) =>
  {
    set((s) => ({ tarefas: s.tarefas.filter((t) => !ids.includes(t.id)) }))
    const deletado_em = new Date().toISOString()
    await Promise.allSettled(
      ids.map((id) => supabase.from('tarefas_unificadas').update({ deletado_em }).eq('id', id))
    )
  },

  batchPriority: async (ids, prioridade) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
        ids.includes(t.id) ? { ...t, prioridade: prioridade as TarefaUnificada['prioridade'] } : t
      ),
    }))
    await Promise.allSettled(
      ids.map((id) => supabase.from('tarefas_unificadas').update({ prioridade }).eq('id', id))
    )
  },

  // ── C8: reorder subtarefas ──
  reorderSubtarefas: (tarefaId, orderedIds) =>
  {
    set((s) => ({
      tarefas: s.tarefas.map((t) =>
      {
        if (t.id !== tarefaId) return t
        const subs = [...(t.subtarefas || [])]
        const reordered = orderedIds.map((id, idx) =>
        {
          const sub = subs.find((s) => s.id === id)
          return sub ? { ...sub, ordem: idx } : null
        }).filter(Boolean) as typeof subs
        return { ...t, subtarefas: reordered }
      }),
    }))
    orderedIds.forEach((id, idx) =>
    {
      supabase.from('subtarefas').update({ ordem: idx }).eq('id', id).then(() => {})
    })
  },

  // ── C7: templates ──
  fetchTemplates: async () =>
  {
    try
    {
      const { data, error } = await supabase.from('tarefa_templates').select('*')
      if (error) throw error
      set({
        templates: (data || []).map((t: any) => ({
          ...t,
          subtarefas: t.subtarefas_json ? JSON.parse(t.subtarefas_json) : [],
        })),
      })
    }
    catch (e) { console.error('fetchTemplates:', e) }
  },

  createTemplate: async (nome, prioridade, subtarefas) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from('tarefa_templates')
        .insert({ user_id: uid, nome, prioridade, subtarefas_json: JSON.stringify(subtarefas) })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ templates: [...s.templates, { ...data, subtarefas }] }))
    }
    catch (e) { console.error('createTemplate:', e) }
  },

  deleteTemplate: async (id) =>
  {
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) }))
    await supabase.from('tarefa_templates').delete().eq('id', id)
  },

  applyTemplate: async (templateId) =>
  {
    try
    {
      const template = get().templates.find((t) => t.id === templateId)
      if (!template) return
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      // cria tarefa
      const { data: tarefa, error } = await supabase
        .from('tarefas_unificadas')
        .insert({ user_id: uid, titulo: template.nome, prioridade: template.prioridade })
        .select()
        .single()
      if (error) throw error
      if (!tarefa) return
      // cria subtarefas do template
      if (template.subtarefas.length > 0)
      {
        await supabase.from('subtarefas').insert(
          template.subtarefas.map((titulo: string, idx: number) => ({
            tarefa_id: tarefa.id,
            titulo,
            ordem: idx,
          }))
        )
      }
      // busca tarefa completa
      const { data: full } = await supabase
        .from('tarefas_unificadas')
        .select('*, subtarefas(*)')
        .eq('id', tarefa.id)
        .single()
      if (full) set((s) => ({ tarefas: [{ ...full, labels: [] }, ...s.tarefas] }))
    }
    catch (e) { console.error('applyTemplate:', e) }
  },
})
