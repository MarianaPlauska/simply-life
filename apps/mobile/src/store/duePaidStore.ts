import { create } from 'zustand'
import { loadDuePaid, saveDuePaid } from '../lib/duePaidPersist'
import { fetchPaidKeysRemote, setPaidRemote } from '../lib/sync/financeMeta'

type State = {
  keys: Record<string, true>
  hydrate: () => void
  isPaid: (key: string) => boolean
  /** meta vai para o registro no banco (título/valor da conta paga) */
  setPaid: (key: string, paid: boolean, meta?: { titulo?: string; valor?: number }) => void
}

export const useDuePaidStore = create<State>((set, get) => ({
  keys: {},

  hydrate: () =>
  {
    // local primeiro (rápido), depois o banco: "pago" deixa de se perder ao trocar de aparelho
    void loadDuePaid().then(async (local) =>
    {
      set({ keys: { ...local, ...get().keys } })
      const remote = await fetchPaidKeysRemote()
      if (Object.keys(remote).length)
      {
        const keys = { ...get().keys, ...remote }
        set({ keys })
        void saveDuePaid(keys)
      }
    })
  },

  isPaid: (key) => Boolean(get().keys[key]),

  setPaid: (key, paid, meta) =>
  {
    const next = { ...get().keys }
    if (paid) next[key] = true
    else delete next[key]
    set({ keys: next })
    void saveDuePaid(next)
    void setPaidRemote(key, paid, meta)
  },
}))
