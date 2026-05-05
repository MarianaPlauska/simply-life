// slice de busca — busca global via supabase full-text
import type { StateCreator } from 'zustand'
import type { BuscaResult } from '../../types'
import { supabase } from '../../lib/supabase'

export interface BuscaSlice
{
  searchResults: BuscaResult | null
  searchLoading: boolean
  buscar: (query: string) => Promise<void>
}

export const createBuscaSlice: StateCreator<BuscaSlice, [], [], BuscaSlice> = (set) => ({
  searchResults: null,
  searchLoading: false,

  buscar: async (query) =>
  {
    if (!query || query.trim().length < 2)
    {
      set({ searchResults: null, searchLoading: false })
      return
    }
    set({ searchLoading: true })
    try
    {
      const q = query.trim()
      // busca tarefas
      const { data: tarefas } = await supabase
        .from('tarefas_unificadas')
        .select('id, titulo, status, prioridade, origem')
        .ilike('titulo', `%${q}%`)
        .is('deletado_em', null)
        .limit(8)
      // busca anotações
      const { data: anotacoes } = await supabase
        .from('anotacoes')
        .select('id, titulo, conteudo')
        .or(`titulo.ilike.%${q}%,conteudo.ilike.%${q}%`)
        .limit(4)

      const anotacoesFormatadas = (anotacoes || []).map(a => ({
        id: a.id,
        titulo: a.titulo,
        preview: a.conteudo ? a.conteudo.substring(0, 100) : ''
      }));

      set({
        searchResults: {
          tarefas: tarefas || [],
          anotacoes: anotacoesFormatadas,
          total: (tarefas?.length || 0) + (anotacoesFormatadas.length || 0),
        },
        searchLoading: false,
      })
    }
    catch (e)
    {
      console.error('buscar:', e)
      set({ searchResults: null, searchLoading: false })
    }
  },
})
