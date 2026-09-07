import { create } from 'zustand'
import {
  loadFixaMeta,
  resolveFixaMeta,
  saveFixaMeta,
  type FixaMeta,
  type FixaMetaMap,
} from '../lib/fixaMeta'

type State = {
  loaded: boolean
  map: FixaMetaMap
  hydrate: () => Promise<void>
  patch: (id: string | number, next: Partial<FixaMeta>) => Promise<void>
  resolve: (id: string | number, categoria: string) => FixaMeta
}

export const useFixaMetaStore = create<State>((set, get) => ({
  loaded: false,
  map: {},

  hydrate: async () =>
  {
    const map = await loadFixaMeta()
    set({ map, loaded: true })
  },

  patch: async (id, next) =>
  {
    const key = String(id)
    const map: FixaMetaMap = {
      ...get().map,
      [key]: { ...get().map[key], ...next },
    }
    set({ map })
    await saveFixaMeta(map)
  },

  resolve: (id, categoria) => resolveFixaMeta(id, get().map, categoria),
}))
