// slice de anotações — crud do segundo cérebro
import type { StateCreator } from 'zustand';
import type { Anotacao } from '../storeTypes';
import { API, authHeaders } from '../api';

export interface AnotacoesSlice {
  anotacoes: Anotacao[];
  fetchAnotacoes: () => Promise<void>;
  addAnotacao: (conteudo: string, titulo?: string) => Promise<void>;
}

export const createAnotacoesSlice: StateCreator<AnotacoesSlice, [], [], AnotacoesSlice> = (set, get) => ({
  anotacoes: [],

  fetchAnotacoes: async () =>
  {
    try
    {
      const res = await fetch(`${API}/anotacoes`, { headers: authHeaders() });
      if ( !res.ok ) throw new Error('falha ao buscar anotações');
      const data = await res.json();
      set({ anotacoes: data.anotacoes });
    }
    catch (e) { console.error('fetchAnotacoes:', e); }
  },

  addAnotacao: async (conteudo, titulo) =>
  {
    const res = await fetch(`${API}/anotacoes`, {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ conteudo, titulo: titulo || null }),
    });
    if ( !res.ok ) throw new Error('falha ao salvar anotação');
    await get().fetchAnotacoes();
  },
});
