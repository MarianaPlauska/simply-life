// slice de anotações — crud via supabase
import type { StateCreator } from 'zustand'
import type { Anotacao } from '../storeTypes'
import { supabase } from '../../lib/supabase'
import type { TarefasSlice } from './tarefasSlice'

export type AnotacaoTipo = 'diario' | 'lembrete' | 'lista'

export interface AnotacoesSlice
{
  anotacoes: Anotacao[]
  fetchAnotacoes: () => Promise<void>
  addAnotacao: (conteudo: string, titulo?: string, tipo?: AnotacaoTipo) => Promise<Anotacao | null>
  createAnotacao: (tipo?: AnotacaoTipo) => Promise<Anotacao | null>
  updateAnotacao: (id: number, patch: Partial<Pick<Anotacao, 'titulo' | 'conteudo' | 'categoria' | 'fixado'>>) => Promise<void>
  deleteAnotacao: (id: number) => Promise<void>
  togglePinAnotacao: (id: number) => Promise<void>
}

type StoreComTarefas = AnotacoesSlice & TarefasSlice

export const createAnotacoesSlice: StateCreator<StoreComTarefas, [], [], AnotacoesSlice> = (set, get) => ({
  anotacoes: [],

  fetchAnotacoes: async () =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return

      const { data, error } = await supabase
        .from('anotacoes')
        .select('*')
        .eq('user_id', uid)
        .order('fixado', { ascending: false })
        .order('id', { ascending: false })
      if (error) throw error
      set({ anotacoes: data || [] })
    }
    catch (e) { console.error('fetchAnotacoes:', e) }
  },

  addAnotacao: async (conteudo, titulo, tipo = 'diario') =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return null
    const { data, error } = await supabase
      .from('anotacoes')
      .insert({
        user_id: uid,
        conteudo,
        titulo: titulo || null,
        categoria: tipo,
      })
      .select()
      .single()
    if (error) throw error
    if (data)
    {
      set((s) => ({ anotacoes: [data, ...s.anotacoes] }))
    }

    if (tipo === 'lembrete')
    {
      const taskTitle = titulo?.trim()
        || conteudo.trim().split('\n')[0].slice(0, 120)
        || 'Lembrete'
      const { syncNoteDatesToKanban } = await import('../../lib/noteDatesToKanban')
      const fromDates = await syncNoteDatesToKanban(conteudo, taskTitle)
      if (fromDates === 0)
      {
        await get().createTarefa(taskTitle, conteudo.trim())
      }
    }
    else
    {
      void import('../../lib/noteDatesToKanban').then(({ syncNoteDatesToKanban }) =>
      {
        void syncNoteDatesToKanban(conteudo, titulo ?? undefined)
      })
    }

    void import('../../lib/processAxelNoteSignals').then(({ processAxelNoteSignals }) =>
    {
      processAxelNoteSignals(`${titulo ?? ''} ${conteudo}`)
    })

    return data ?? null
  },

  createAnotacao: async (tipo = 'diario') =>
  {
    const defaults: Record<AnotacaoTipo, { titulo: string; conteudo: string }> = {
      diario: { titulo: 'Diário', conteudo: '' },
      lembrete: { titulo: 'Lembrete', conteudo: '' },
      lista: { titulo: 'Lista', conteudo: '- [ ] \n- [ ] ' },
    }
    const base = defaults[tipo]
    return get().addAnotacao(base.conteudo, base.titulo, tipo)
  },

  updateAnotacao: async (id, patch) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return

    const { error } = await supabase
      .from('anotacoes')
      .update(patch)
      .eq('id', id)
      .eq('user_id', uid)
    if (error) throw error

    set((s) => ({
      anotacoes: s.anotacoes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    }))

    if (patch.conteudo != null || patch.titulo != null)
    {
      const note = get().anotacoes.find((n) => n.id === id)
      const merged = `${patch.titulo ?? note?.titulo ?? ''} ${patch.conteudo ?? note?.conteudo ?? ''}`
      void import('../../lib/processAxelNoteSignals').then(({ processAxelNoteSignals }) =>
      {
        processAxelNoteSignals(merged)
      })
      void import('../../lib/noteDatesToKanban').then(({ syncNoteDatesToKanban }) =>
      {
        void syncNoteDatesToKanban(merged, patch.titulo ?? note?.titulo ?? undefined)
      })
    }
  },

  deleteAnotacao: async (id) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return

    const { error } = await supabase
      .from('anotacoes')
      .delete()
      .eq('id', id)
      .eq('user_id', uid)
    if (error) throw error

    set((s) => ({ anotacoes: s.anotacoes.filter((n) => n.id !== id) }))
  },

  togglePinAnotacao: async (id) =>
  {
    const note = get().anotacoes.find((n) => n.id === id)
    if (!note) return
    const next = note.fixado === 1 ? 0 : 1
    await get().updateAnotacao(id, { fixado: next })
  },
})
