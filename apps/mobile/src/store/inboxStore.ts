import { create } from 'zustand'
import { dismissInboxEvent, fetchInboxEvents, type UnifiedEvent } from '../lib/sync/inbox'

type InboxState = {
  events: UnifiedEvent[]
  loading: boolean
  refresh: () => Promise<void>
  dismiss: (id: string) => Promise<void>
}

export const useInboxStore = create<InboxState>((set, get) => ({
  events: [],
  loading: false,

  refresh: async () =>
  {
    set({ loading: true })
    try
    {
      const events = await fetchInboxEvents()
      set({ events, loading: false })
    }
    catch
    {
      set({ loading: false })
    }
  },

  dismiss: async (id) =>
  {
    await dismissInboxEvent(id)
    set({ events: get().events.filter((e) => e.id !== id) })
  },
}))
