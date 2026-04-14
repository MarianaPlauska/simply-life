// slice de triagem — motor de ia, palavras-chave, simulação de email
import type { StateCreator } from 'zustand';
import type { PalavraChave, ProcessarMensagemResult } from '../storeTypes';
import { API, authHeaders } from '../api';

export interface TriagemSlice {
  palavrasChave: PalavraChave[];
  fetchPalavrasChave: () => Promise<void>;
  addPalavraChave: (termo: string, peso?: number) => Promise<void>;
  removePalavraChave: (id: number) => Promise<void>;
  processarMensagem: (conteudo: string, origem: string, remetente: string) => Promise<ProcessarMensagemResult>;
  simularEmailRecebido: (texto: string, remetente: string) => Promise<void>;
}

// precisa acessar fetchTarefas e fetchDashboard do store global
type FullGet = () => TriagemSlice & {
  fetchTarefas: () => Promise<void>;
  fetchDashboard: () => Promise<void>;
};

export const createTriagemSlice: StateCreator<TriagemSlice, [], [], TriagemSlice> = (set, get) => ({
  palavrasChave: [] as PalavraChave[],

  fetchPalavrasChave: async () =>
  {
    try
    {
      const res = await fetch(`${API}/triagem/palavras-chave`, { headers: authHeaders() });
      if ( !res.ok ) return;
      const data = await res.json();
      set({ palavrasChave: data });
    }
    catch (e) { console.error('fetchPalavrasChave:', e); }
  },

  addPalavraChave: async (termo, peso = 1) =>
  {
    try
    {
      const res = await fetch(`${API}/triagem/palavras-chave`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ termo, peso }),
      });
      if ( res.ok )
      {
        const nova = await res.json();
        set((s) => ({ palavrasChave: [...s.palavrasChave, nova] }));
      }
    }
    catch (e) { console.error('addPalavraChave:', e); }
  },

  removePalavraChave: async (id) =>
  {
    try
    {
      const res = await fetch(`${API}/triagem/palavras-chave/${id}`, {
        method: 'DELETE', headers: authHeaders(),
      });
      if ( res.ok ) set((s) => ({ palavrasChave: s.palavrasChave.filter((p) => p.id !== id) }));
    }
    catch (e) { console.error('removePalavraChave:', e); }
  },

  processarMensagem: async (conteudo, origem, remetente) =>
  {
    try
    {
      const res = await fetch(`${API}/triagem/processar-mensagem`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ conteudo, origem, remetente }),
      });
      if ( res.ok )
      {
        const data = await res.json();
        if ( data.status === 'match' && data.tarefa )
        {
          (get as unknown as FullGet)().fetchTarefas();
        }
        return { status: data.status, termo_detectado: data.termo_detectado, tarefa: data.tarefa };
      }
      return { status: 'ignorado' as const };
    }
    catch (e)
    {
      console.error('processarMensagem:', e);
      return { status: 'ignorado' as const };
    }
  },

  // garante que a keyword 'pagamento' existe antes de disparar
  simularEmailRecebido: async (texto, remetente) =>
  {
    try
    {
      const keywords = get().palavrasChave;
      if ( !keywords.some(k => k.termo === 'pagamento') )
      {
        await get().addPalavraChave('pagamento', 8);
      }
      const resultado = await get().processarMensagem(texto, 'gmail_mock', remetente);
      if ( resultado.status === 'match' )
      {
        const full = get as unknown as FullGet;
        await Promise.all([full().fetchTarefas(), full().fetchDashboard()]);
      }
    }
    catch (e) { console.error('simularEmailRecebido:', e); }
  },
});
