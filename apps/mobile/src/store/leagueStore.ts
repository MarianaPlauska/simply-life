import { create } from 'zustand'
import type { League, LeagueMember, LeagueProgress } from '@simply-life/shared'
import { fetchLeagueMembers, fetchLeagueProgress, fetchMyLeagues, leaveLeague, notifyLeaguePot } from '../lib/sync/leagues'
import { useAuthStore } from './authStore'

type State = {
  leagues: League[]
  progress: Record<string, LeagueProgress | null>
  members: Record<string, LeagueMember[]>
  loaded: boolean
  loading: boolean
  load: () => Promise<void>
  loadDetail: (id: string) => Promise<void>
  leave: (id: string) => Promise<boolean>
}

/** liga+semana já pedidas nesta sessão (o servidor também garante uma vez só) */
const asked = new Set<string>()

function maybeNotify(id: string, p: LeagueProgress | null): void
{
  if (!p || p.membros < 2) return
  if (p.faixa !== 4 && !p.semanaPassada?.subiu) return
  const key = `${id}|${p.semana}`
  if (asked.has(key)) return
  asked.add(key)
  void notifyLeaguePot(id)
}

function canUseRemote(): boolean
{
  const { userId, isGuest } = useAuthStore.getState()
  return Boolean(userId) && !isGuest
}

/** Ligas cooperativas: lista, pote (só faixa) e pessoas. */
export const useLeagueStore = create<State>((set, get) => ({
  leagues: [],
  progress: {},
  members: {},
  loaded: false,
  loading: false,

  load: async () =>
  {
    if (!canUseRemote())
    {
      set({ leagues: [], loaded: true })
      return
    }
    if (get().loading) return
    set({ loading: true })
    try
    {
      const leagues = await fetchMyLeagues()
      set({ leagues, loaded: true, loading: false })
      const pairs = await Promise.all(leagues.map(async (l) => [l.id, await fetchLeagueProgress(l.id)] as const))
      set({ progress: { ...get().progress, ...Object.fromEntries(pairs) } })
      for (const [lid, p] of pairs) maybeNotify(lid, p)
    }
    catch
    {
      set({ loaded: true, loading: false })
    }
  },

  loadDetail: async (id) =>
  {
    if (!canUseRemote()) return
    const [progress, members] = await Promise.all([fetchLeagueProgress(id), fetchLeagueMembers(id)])
    set({
      progress: { ...get().progress, [id]: progress },
      members: { ...get().members, [id]: members },
    })
    maybeNotify(id, progress)
  },

  leave: async (id) =>
  {
    const ok = await leaveLeague(id)
    if (ok) set({ leagues: get().leagues.filter((l) => l.id !== id) })
    return ok
  },
}))
