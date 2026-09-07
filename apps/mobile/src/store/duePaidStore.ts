import { create } from 'zustand'
import { loadDuePaid, saveDuePaid } from '../lib/duePaidPersist'

type State = {
  keys: Record<string, true>
  hydrate: () => void
  isPaid: (key: string) => boolean
  setPaid: (key: string, paid: boolean) => void
}

export const useDuePaidStore = create<State>((set, get) => ({
  keys: {},

  hydrate: () =>
  {
    void loadDuePaid().then((keys) => set({ keys }))
  },

  isPaid: (key) => Boolean(get().keys[key]),

  setPaid: (key, paid) =>
  {
    const next = { ...get().keys }
    if (paid) next[key] = true
    else delete next[key]
    set({ keys: next })
    void saveDuePaid(next)
  },
}))
