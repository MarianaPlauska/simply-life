import { create } from 'zustand'
import type { ChartSeries } from '@simply-life/ui-tokens'
import { defaultFolderSeries, type UserTaskList } from '@simply-life/shared'
import { loadKanbanLists, saveKanbanLists } from '../lib/kanbanListsPersist'

type State = {
  lists: UserTaskList[]
  hydrate: () => void
  /** `color` é uma chave da paleta (`ChartSeries`), resolvida na renderização */
  addList: (name: string, color?: ChartSeries) => UserTaskList | null
  patchList: (id: string, patch: Partial<Pick<UserTaskList, 'name' | 'color' | 'notas'>>) => void
  removeList: (id: string) => void
}

export const useKanbanListsStore = create<State>((set, get) => ({
  lists: [],
  hydrate: () =>
  {
    void loadKanbanLists().then((lists) => set({ lists }))
  },
  addList: (name, color) =>
  {
    const label = name.trim()
    if (!label) return null
    const lists = get().lists
    const item: UserTaskList = {
      id: `l${Date.now().toString(36)}`,
      name: label,
      color: color || defaultFolderSeries(lists.length),
      notas: '',
      createdAt: new Date().toISOString(),
    }
    const next = [...lists, item]
    void saveKanbanLists(next)
    set({ lists: next })
    return item
  },
  patchList: (id, patch) =>
  {
    const next = get().lists.map((list) =>
    {
      if (list.id !== id) return list
      return { ...list, ...patch }
    })
    void saveKanbanLists(next)
    set({ lists: next })
  },
  removeList: (id) =>
  {
    const next = get().lists.filter((list) => list.id !== id)
    void saveKanbanLists(next)
    set({ lists: next })
  },
}))
