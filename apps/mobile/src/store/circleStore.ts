import { create } from 'zustand'
import { fetchFriends, type FriendCard } from '../lib/sync/friends'
import { useAuthStore } from './authStore'

const STALE_MS = 5 * 60_000

type State = {
  friends: FriendCard[]
  loadedAt: number
  loading: boolean
  /** recarrega os amigos do Círculo (no máximo a cada 5 min, salvo `force`) */
  load: (force?: boolean) => Promise<void>
}

/** Amigos do Círculo em memória: o cantinho do perfil e o formulário de espera usam. */
export const useCircleStore = create<State>((set, get) => ({
  friends: [],
  loadedAt: 0,
  loading: false,

  load: async (force) =>
  {
    const { userId, isGuest } = useAuthStore.getState()
    if (!userId || isGuest) return
    if (get().loading) return
    if (!force && Date.now() - get().loadedAt < STALE_MS) return
    set({ loading: true })
    try
    {
      const friends = await fetchFriends()
      set({ friends, loadedAt: Date.now(), loading: false })
    }
    catch
    {
      set({ loading: false })
    }
  },
}))
