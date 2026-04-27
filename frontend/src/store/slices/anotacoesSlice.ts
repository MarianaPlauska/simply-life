// slice de anotações — crud via supabase
import type { StateCreator } from 'zustand'
import type { Anotacao } from '../storeTypes'
import { supabase } from '../../lib/supabase'

export interface AnotacoesSlice
{
  anotacoes: Anotacao[]
  fetchAnotacoes: () => Promise<void>
  addAnotacao: (conteudo: string, titulo?: string) => Promise<void>
}

export const createAnotacoesSlice: StateCreator<AnotacoesSlice, [], [], AnotacoesSlice> = (set) => ({
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

  addAnotacao: async (conteudo, titulo) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return
    const { data, error } = await supabase
      .from('anotacoes')
      .insert({ user_id: uid, conteudo, titulo: titulo || null })
      .select()
      .single()
    if (error) throw error
    if (data) set((s) => ({ anotacoes: [data, ...s.anotacoes] }))
  },
})
