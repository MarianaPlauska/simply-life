import { create } from 'zustand'
import {
  loadCategoryMeta,
  resolveCategoryMeta,
  saveCategoryMeta,
  slugCategoryId,
  visibleCategoryIds,
  type CategoryMeta,
  type CategoryMetaMap,
} from '../lib/categoryMeta'
import { fetchCategoryMetaRemote, upsertCategoryMetaRemote } from '../lib/sync/financeMeta'

type State = {
  loaded: boolean
  map: CategoryMetaMap
  hydrate: () => Promise<void>
  patch: (id: string, next: Partial<CategoryMeta>) => Promise<void>
  create: (label: string, icon: string, color: string) => Promise<string | null>
  remove: (id: string) => Promise<void>
  resolve: (id: string) => CategoryMeta
  ids: () => string[]
}

export const useCategoryMetaStore = create<State>((set, get) => ({
  loaded: false,
  map: {},

  hydrate: async () =>
  {
    const map = await loadCategoryMeta()
    set({ map, loaded: true })
    // o que foi personalizado em outro aparelho vem do banco (fin_categorias)
    const remote = await fetchCategoryMetaRemote()
    if (Object.keys(remote).length)
    {
      const merged: CategoryMetaMap = { ...get().map, ...remote }
      set({ map: merged })
      await saveCategoryMeta(merged)
    }
  },

  patch: async (id, next) =>
  {
    const current = resolveCategoryMeta(id, get().map)
    const map: CategoryMetaMap = {
      ...get().map,
      [id]: { ...current, ...next },
    }
    set({ map })
    await saveCategoryMeta(map)
    void upsertCategoryMetaRemote(id, map[id] as CategoryMeta)
  },

  create: async (label, icon, color) =>
  {
    const name = label.trim()
    if (!name) return null
    let id = slugCategoryId(name)
    let n = 2
    while (get().map[id] || id === 'outros')
    {
      id = `${slugCategoryId(name)}-${n}`
      n += 1
    }
    const map: CategoryMetaMap = {
      ...get().map,
      [id]: { label: name, icon, color, custom: true },
    }
    set({ map })
    await saveCategoryMeta(map)
    void upsertCategoryMetaRemote(id, map[id] as CategoryMeta)
    return id
  },

  remove: async (id) =>
  {
    const current = resolveCategoryMeta(id, get().map)
    if (current.custom)
    {
      const map = { ...get().map }
      delete map[id]
      set({ map })
      await saveCategoryMeta(map)
      // no banco só esconde: gastos antigos continuam apontando para ela
      void upsertCategoryMetaRemote(id, { ...current, hidden: true })
      return
    }
    const map: CategoryMetaMap = {
      ...get().map,
      [id]: { ...current, hidden: true },
    }
    set({ map })
    await saveCategoryMeta(map)
    void upsertCategoryMetaRemote(id, map[id] as CategoryMeta)
  },

  resolve: (id) => resolveCategoryMeta(id, get().map),
  ids: () => visibleCategoryIds(get().map),
}))
