// slice de triagem — motor de palavras-chave via supabase
import type { StateCreator } from 'zustand'
import type { PalavraChave, ProcessarMensagemResult } from '../storeTypes'
import { supabase } from '../../lib/supabase'

export interface TriagemSlice
{
  palavrasChave: PalavraChave[]
  isSyncingGmail: boolean
  lastSyncResult: { emails_lidos: number; tarefas_geradas: number } | null
  fetchPalavrasChave: () => Promise<void>
  addPalavraChave: (termo: string, peso?: number) => Promise<void>
  removePalavraChave: (id: number) => Promise<void>
  processarMensagem: (conteudo: string, origem: string, remetente: string) => Promise<ProcessarMensagemResult>
  simularEmailRecebido: (texto: string, remetente: string) => Promise<void>
  sincronizarGmail: () => Promise<{ emails_lidos: number; tarefas_geradas: number } | null>
}

type FullGet = () => TriagemSlice & {
  fetchTarefas: () => Promise<void>
  fetchDashboard: () => Promise<void>
}

export const createTriagemSlice: StateCreator<TriagemSlice, [], [], TriagemSlice> = (set, get) => ({
  palavrasChave: [] as PalavraChave[],
  isSyncingGmail: false,
  lastSyncResult: null,

  fetchPalavrasChave: async () =>
  {
    try
    {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const { data, error } = await supabase.from('palavras_chave').select('*')
      if (error) throw error
      set({ palavrasChave: data || [] })
    }
    catch (e) { console.error('fetchPalavrasChave:', e) }
  },

  addPalavraChave: async (termo, peso = 1) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return
      const { data, error } = await supabase
        .from('palavras_chave')
        .insert({ user_id: uid, termo, peso })
        .select()
        .single()
      if (error) throw error
      if (data) set((s) => ({ palavrasChave: [...s.palavrasChave, data] }))
    }
    catch (e) { console.error('addPalavraChave:', e) }
  },

  removePalavraChave: async (id) =>
  {
    try
    {
      await supabase.from('palavras_chave').delete().eq('id', id)
      set((s) => ({ palavrasChave: s.palavrasChave.filter((p) => p.id !== id) }))
    }
    catch (e) { console.error('removePalavraChave:', e) }
  },

  // processamento local — compara título com keywords
  processarMensagem: async (conteudo, origem, remetente) =>
  {
    try
    {
      const uid = (await supabase.auth.getUser()).data.user?.id
      if (!uid) return { status: 'ignorado' as const }

      const keywords = get().palavrasChave
      const lower = conteudo.toLowerCase()
      const matched = keywords.find((k) => lower.includes(k.termo.toLowerCase()))

      if (matched)
      {
        // cria tarefa automaticamente
        await supabase.from('tarefas_unificadas').insert({
          user_id: uid,
          titulo: conteudo.substring(0, 120),
          descricao: `De: ${remetente}\nOrigem: ${origem}`,
          origem,
          status: 'pendente',
          score_urgencia: matched.peso * 10,
        })
        ;(get as unknown as FullGet)().fetchTarefas()
        return { status: 'match' as const, termo_detectado: matched.termo, tarefa: null }
      }
      return { status: 'ignorado' as const }
    }
    catch (e)
    {
      console.error('processarMensagem:', e)
      return { status: 'ignorado' as const }
    }
  },

  simularEmailRecebido: async (texto, remetente) =>
  {
    try
    {
      const keywords = get().palavrasChave
      if (!keywords.some((k) => k.termo === 'pagamento'))
      {
        await get().addPalavraChave('pagamento', 8)
      }
      const resultado = await get().processarMensagem(texto, 'gmail_mock', remetente)
      if (resultado.status === 'match')
      {
        const full = get as unknown as FullGet
        await Promise.all([full().fetchTarefas(), full().fetchDashboard()])
      }
    }
    catch (e) { console.error('simularEmailRecebido:', e) }
  },

  // gmail sync — placeholder (precisa edge function futuramente)
  sincronizarGmail: async () =>
  {
    if (get().isSyncingGmail) return null
    set({ isSyncingGmail: true, lastSyncResult: null })
    try
    {
      // placeholder — será implementado como edge function
      const result = { emails_lidos: 0, tarefas_geradas: 0 }
      set({ isSyncingGmail: false, lastSyncResult: result })
      return result
    }
    catch
    {
      set({ isSyncingGmail: false })
      return null
    }
  },
})
