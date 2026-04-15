// slice de anotações — crud do segundo cérebro
import type { StateCreator } from 'zustand';
import type { Anotacao } from '../storeTypes';
import { apiFetch } from '../api';

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
      const res = await apiFetch('/anotacoes');
      if ( !res.ok ) throw new Error('falha ao buscar anotações');
      const data = await res.json();
      set({ anotacoes: data.anotacoes });
    }
    catch (e) { console.error('fetchAnotacoes:', e); }
  },

  addAnotacao: async (conteudo, titulo) =>
  {
    const res = await apiFetch('/anotacoes', {
      method: 'POST',
      body: JSON.stringify({ conteudo, titulo: titulo || null }),
    });
    if ( !res.ok ) throw new Error('falha ao salvar anotação');
    await get().fetchAnotacoes();
  },
});
