// slice de busca — busca global full-text
import type { StateCreator } from 'zustand';
import type { BuscaResult } from '../../types';
import { API, authHeaders } from '../api';

export interface BuscaSlice {
  searchResults: BuscaResult | null;
  searchLoading: boolean;
  buscar: (query: string) => Promise<void>;
}

export const createBuscaSlice: StateCreator<BuscaSlice, [], [], BuscaSlice> = (set) => ({
  searchResults: null,
  searchLoading: false,

  buscar: async (query) =>
  {
    if ( !query || query.trim().length < 2 )
    {
      set({ searchResults: null, searchLoading: false });
      return;
    }
    set({ searchLoading: true });
    try
    {
      const res = await fetch(`${API}/busca?q=${encodeURIComponent(query.trim())}&limite=8`, {
        headers: authHeaders(),
      });
      if ( res.ok )
      {
        const data = await res.json();
        set({ searchResults: data, searchLoading: false });
      }
      else
      {
        set({ searchResults: null, searchLoading: false });
      }
    }
    catch (e)
    {
      console.error('buscar:', e);
      set({ searchResults: null, searchLoading: false });
    }
  },
});
