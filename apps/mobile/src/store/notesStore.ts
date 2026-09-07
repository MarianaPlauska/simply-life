import { create } from 'zustand'
import {
  fetchAnotacoes,
  insertAnotacao,
  patchAnotacao,
  removeAnotacao,
  type Anotacao,
  type AnotacaoTipo,
} from '../lib/sync/notes'
import { useActivityStore } from './activityStore'

type NotesState = {
  items: Anotacao[]
  loading: boolean
  refresh: () => Promise<void>
  create: (tipo?: AnotacaoTipo) => Promise<Anotacao | null>
  update: (id: number, patch: Partial<Pick<Anotacao, 'titulo' | 'conteudo' | 'fixado'>>) => Promise<void>
  remove: (id: number) => Promise<void>
}

export const useNotesStore = create<NotesState>((set, get) => ({
  items: [],
  loading: false,

  refresh: async () =>
  {
    set({ loading: true })
    try
    {
      const items = await fetchAnotacoes()
      set({ items, loading: false })
    }
    catch
    {
      set({ loading: false })
    }
  },

  create: async (tipo = 'diario') =>
  {
    const row = await insertAnotacao(tipo)
    if (row)
    {
      set({ items: [row, ...get().items] })
      useActivityStore.getState().markAction('note')
    }
    return row
  },

  update: async (id, patch) =>
  {
    await patchAnotacao(id, patch)
    set({
      items: get().items.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })
    if (patch.conteudo && patch.conteudo.trim())
    {
      useActivityStore.getState().markAction('note')
    }
  },

  remove: async (id) =>
  {
    await removeAnotacao(id)
    set({ items: get().items.filter((n) => n.id !== id) })
  },
}))
