import { create } from 'zustand'
import type {
  SharedGoal,
  SharedGoalCheer,
  SharedGoalMemberCard,
  SharedGoalProgress,
} from '@simply-life/shared'
import {
  fetchGoalCheers,
  fetchGoalMembers,
  fetchGoalProgress,
  fetchMyGoals,
  leaveSharedGoal,
  setSharedGoalMuted,
  type MyGoalMembership,
} from '../lib/sync/sharedGoals'
import { useAuthStore } from './authStore'

type State = {
  goals: SharedGoal[]
  memberships: Record<string, MyGoalMembership>
  progress: Record<string, SharedGoalProgress | null>
  members: Record<string, SharedGoalMemberCard[]>
  cheers: Record<string, SharedGoalCheer[]>
  loaded: boolean
  loading: boolean
  error: string | null
  /** Recarrega a lista (e o progresso de cada meta) */
  load: () => Promise<void>
  /** Recarrega uma meta: progresso, pessoas e apoios */
  loadDetail: (goalId: string) => Promise<void>
  refreshProgress: (goalId: string) => Promise<void>
  setMuted: (goalId: string, muted: boolean) => Promise<boolean>
  leave: (goalId: string) => Promise<boolean>
  reset: () => void
}

function canUseRemote(): boolean
{
  const { userId, isGuest } = useAuthStore.getState()
  return Boolean(userId) && !isGuest
}

export const useSharedGoalsStore = create<State>((set, get) => ({
  goals: [],
  memberships: {},
  progress: {},
  members: {},
  cheers: {},
  loaded: false,
  loading: false,
  error: null,

  load: async () =>
  {
    if (!canUseRemote())
    {
      set({ goals: [], memberships: {}, loaded: true, loading: false, error: null })
      return
    }
    if (get().loading) return
    set({ loading: true, error: null })
    try
    {
      const { goals, memberships } = await fetchMyGoals()
      const byId: Record<string, MyGoalMembership> = {}
      for (const m of memberships) byId[m.goalId] = m
      set({ goals, memberships: byId, loaded: true, loading: false })
      const pairs = await Promise.all(
        goals.map(async (g) => [g.id, await fetchGoalProgress(g.id)] as const),
      )
      set({ progress: { ...get().progress, ...Object.fromEntries(pairs) } })
    }
    catch
    {
      set({ loading: false, loaded: true, error: 'Não deu para carregar as metas agora' })
    }
  },

  loadDetail: async (goalId) =>
  {
    if (!canUseRemote()) return
    const [progress, members, cheers] = await Promise.all([
      fetchGoalProgress(goalId),
      fetchGoalMembers(goalId),
      fetchGoalCheers(goalId),
    ])
    set({
      progress: { ...get().progress, [goalId]: progress },
      members: { ...get().members, [goalId]: members },
      cheers: { ...get().cheers, [goalId]: cheers },
    })
  },

  refreshProgress: async (goalId) =>
  {
    if (!canUseRemote()) return
    const progress = await fetchGoalProgress(goalId)
    set({ progress: { ...get().progress, [goalId]: progress } })
  },

  setMuted: async (goalId, muted) =>
  {
    const ok = await setSharedGoalMuted(goalId, muted)
    if (ok)
    {
      const cur = get().memberships[goalId]
      if (cur) set({ memberships: { ...get().memberships, [goalId]: { ...cur, muted } } })
    }
    return ok
  },

  leave: async (goalId) =>
  {
    const ok = await leaveSharedGoal(goalId)
    if (ok)
    {
      const memberships = { ...get().memberships }
      delete memberships[goalId]
      set({ goals: get().goals.filter((g) => g.id !== goalId), memberships })
    }
    return ok
  },

  reset: () => set({ goals: [], memberships: {}, progress: {}, members: {}, cheers: {}, loaded: false, error: null }),
}))
