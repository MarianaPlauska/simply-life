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
  addAnotacao: (conteudo: string, titulo?: string, tipo?: AnotacaoTipo) => Promise<void>
}

type StoreComTarefas = AnotacoesSlice & TarefasSlice

export const createAnotacoesSlice: StateCreator<StoreComTarefas, [], [], AnotacoesSlice> = (set, get) => ({
  anotacoes: [],

  fetchAnotacoes: async () =>
  {
    try
    {
      const { data, error } = await supabase
        .from('anotacoes')
        .select('*')
        .order('id', { ascending: false })
      if (error) throw error
      set({ anotacoes: data || [] })
    }
    catch (e) { console.error('fetchAnotacoes:', e) }
  },

  addAnotacao: async (conteudo, titulo, tipo = 'diario') =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
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
      await get().createTarefa(taskTitle, conteudo.trim())
    }
  },
})
