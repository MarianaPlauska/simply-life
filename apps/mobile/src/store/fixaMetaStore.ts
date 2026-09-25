import { create } from 'zustand'
import {
  loadFixaMeta,
  resolveFixaMeta,
  saveFixaMeta,
  type FixaMeta,
  type FixaMetaMap,
} from '../lib/fixaMeta'
import { fetchFixaMetaRemote, upsertFixaMetaRemote } from '../lib/sync/financeMeta'

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
    const remote = await fetchFixaMetaRemote()
    if (Object.keys(remote).length)
    {
      const merged: FixaMetaMap = { ...get().map }
      for (const [k, v] of Object.entries(remote)) merged[k] = { ...merged[k], ...v }
      set({ map: merged })
      await saveFixaMeta(merged)
    }
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
    void upsertFixaMetaRemote(id, map[key])
  },

  resolve: (id, categoria) => resolveFixaMeta(id, get().map, categoria),
}))
