import type { StateCreator } from 'zustand'
import { supabase } from '../../lib/supabase'
import { readLocalOuro, writeLocalOuro } from '../../lib/goldEconomy'
import type { UserStats } from './gamificacaoSlice'

export interface GoldSlice
{
  addGold: (amount: number) => Promise<number>
  spendGold: (amount: number) => Promise<boolean>
}

type GoldStore = GoldSlice & { userStats: UserStats | null }

async function persistOuro(uid: string, ouro: number): Promise<void>
{
  writeLocalOuro(uid, ouro)
  const { error } = await supabase
    .from('user_stats')
    .update({ ouro, updated_at: new Date().toISOString() })
    .eq('id', uid)
  if (error)
  {
    console.warn('persistOuro:', error.message)
  }
}

export const createGoldSlice: StateCreator<GoldStore, [], [], GoldSlice> = (set, get) => ({
  addGold: async (amount) =>
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid || amount === 0) return 0

    const stats = get().userStats
    const current = stats?.ouro ?? readLocalOuro(uid)
    const next = Math.max(0, current + amount)

    if (stats)
    {
      set({ userStats: { ...stats, ouro: next } })
    }
    await persistOuro(uid, next)
    return next - current
  },

  spendGold: async (amount) =>
  {
    if (amount <= 0) return false
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return false
    const stats = get().userStats
    const current = stats?.ouro ?? readLocalOuro(uid)
    if (current < amount) return false
    await get().addGold(-amount)
    return true
  },
})
