// slice de triagem — motor de palavras-chave via supabase
import type { StateCreator } from 'zustand'
import type { PalavraChave, ProcessarMensagemResult } from '../storeTypes'
import { supabase } from '../../lib/supabase'
import { syncGmailImap } from '../../lib/gmailImapApi'
import { syncGmailNow } from '../../lib/googleIntegrationApi'

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

  // gmail sync — FastAPI se configurado; senão ingest demo via Groq
  sincronizarGmail: async () =>
  {
    if (get().isSyncingGmail) return null
    set({ isSyncingGmail: true, lastSyncResult: null })
    try
    {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user)
      {
        set({ isSyncingGmail: false })
        return null
      }

      // Gmail gratuito (IMAP + senha de app) — prioridade
      try
      {
        const result = await syncGmailImap()
        const full = get as unknown as FullGet
        await Promise.all([full().fetchTarefas(), full().fetchDashboard()])
        set({ isSyncingGmail: false, lastSyncResult: result })
        return result
      }
      catch (imapErr)
      {
        const msg = imapErr instanceof Error ? imapErr.message : ''
        if (!msg.includes('não configurado') && !msg.includes('Não autenticado'))
        {
          console.warn('syncGmailImap:', imapErr)
        }
      }

      // OAuth Google (opcional) — sync via API
      try
      {
        const result = await syncGmailNow()
        const full = get as unknown as FullGet
        await Promise.all([full().fetchTarefas(), full().fetchDashboard()])
        set({ isSyncingGmail: false, lastSyncResult: result })
        return result
      }
      catch (syncErr)
      {
        const msg = syncErr instanceof Error ? syncErr.message : ''
        // Sem Google conectado — cai no demo abaixo
        if (!msg.includes('não conectado') && !msg.includes('Não autenticado'))
        {
          console.warn('syncGmailNow:', syncErr)
        }
      }

      const apiUrl = import.meta.env.VITE_API_URL as string | undefined
      if (apiUrl)
      {
        const { data: { session } } = await supabase.auth.getSession()
        const res = await fetch(`${apiUrl}/integracoes/gmail/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token
              ? { Authorization: `Bearer ${session.access_token}` }
              : {}),
          },
        })
        if (res.ok)
        {
          const data = await res.json() as { emails_lidos?: number; tarefas_geradas?: number }
          const result = {
            emails_lidos: data.emails_lidos ?? 0,
            tarefas_geradas: data.tarefas_geradas ?? 0,
          }
          const full = get as unknown as FullGet
          await Promise.all([full().fetchTarefas(), full().fetchDashboard()])
          set({ isSyncingGmail: false, lastSyncResult: result })
          return result
        }
      }

      const keywords = get().palavrasChave.map((k) => k.termo)
      const demoEmails = [
        {
          sender: 'cliente@sst.com.br',
          subject: '[URGENTE] Aprovação documento SST — prazo amanhã',
          body: 'Precisamos da aprovação até amanhã às 17h para liberar o deploy.',
        },
        {
          sender: 'equipe@finally.dev',
          subject: '[FINALLY] Bloqueio no pipeline de release',
          body: 'Pipeline bloqueado aguardando revisão de segurança. Impedimento crítico.',
        },
      ]

      let tarefasGeradas = 0
      for (const email of demoEmails)
      {
        const res = await fetch('/api/ingest-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            ...email,
            user_keywords: keywords,
          }),
        })
        if (res.ok)
        {
          const data = await res.json() as { succeeded?: number }
          tarefasGeradas += data.succeeded ?? 0
        }
      }

      const result = {
        emails_lidos: demoEmails.length,
        tarefas_geradas: tarefasGeradas,
      }
      const full = get as unknown as FullGet
      await Promise.all([full().fetchTarefas(), full().fetchDashboard()])
      set({ isSyncingGmail: false, lastSyncResult: result })
      return result
    }
    catch (e)
    {
      console.error('sincronizarGmail:', e)
      set({ isSyncingGmail: false })
      return null
    }
  },
})
