import type { StateCreator } from 'zustand'
import {
  loadWorkspacePrefs,
  saveWorkspacePrefs,
  type UserWorkspacePrefs,
  DEFAULT_WORKSPACE_PREFS,
} from '../../lib/userWorkspacePrefs'
import { applyAccentTheme } from '../../lib/applyAccentTheme'
import {
  accentIdFromCosmetic,
  getCosmeticById,
  isCosmeticUnlocked,
  mergeUnlockedCosmetics,
  type ActiveCosmetics,
  type CosmeticCategory,
} from '../../lib/axelCosmetics'
import type { UISlice } from './uiSlice'
import type { GamificacaoSlice } from './gamificacaoSlice'
import type { AxelStreakSlice } from './axelStreakSlice'

export interface UserPrefsSlice
{
  workspacePrefs: UserWorkspacePrefs
  workspacePrefsLoaded: boolean
  fetchWorkspacePrefs: () => Promise<void>
  patchWorkspacePrefs: (patch: Partial<UserWorkspacePrefs>) => Promise<UserWorkspacePrefs>
  applyWorkspaceTheme: () => void
  reconcileCosmeticUnlocks: () => Promise<void>
  equipCosmetic: (cosmeticId: string) => Promise<boolean>
  purchaseCosmeticWithXp: (cosmeticId: string) => Promise<{ ok: boolean; message: string }>
}

type PrefsStore = UserPrefsSlice
  & Pick<UISlice, 'accessibility'>
  & Pick<GamificacaoSlice, 'userStats' | 'spendXp'>
  & Pick<AxelStreakSlice, 'streakCount'>

function activeFieldForCategory(category: CosmeticCategory): keyof ActiveCosmetics | null
{
  if (category === 'frame') return 'frame'
  if (category === 'badge') return 'badge'
  if (category === 'mascot_skin') return 'mascot_skin'
  if (category === 'ai_tone') return 'ai_tone'
  if (category === 'profile_aura') return 'profile_aura'
  return null
}

export const createUserPrefsSlice: StateCreator<PrefsStore, [], [], UserPrefsSlice> = (set, get) => ({
  workspacePrefs: DEFAULT_WORKSPACE_PREFS,
  workspacePrefsLoaded: false,

  fetchWorkspacePrefs: async () =>
  {
    const prefs = await loadWorkspacePrefs()
    set({ workspacePrefs: prefs, workspacePrefsLoaded: true })
    get().applyWorkspaceTheme()
    await get().reconcileCosmeticUnlocks()
  },

  patchWorkspacePrefs: async (patch) =>
  {
    const merged = await saveWorkspacePrefs(patch)
    set({ workspacePrefs: merged })
    get().applyWorkspaceTheme()
    return merged
  },

  applyWorkspaceTheme: () =>
  {
    const scheme = get().accessibility.colorScheme === 'light' ? 'light' : 'dark'
    applyAccentTheme(get().workspacePrefs.accent, scheme)
  },

  reconcileCosmeticUnlocks: async () =>
  {
    const ctx = {
      level: get().userStats?.level ?? 1,
      streakCount: get().streakCount,
    }
    const merged = mergeUnlockedCosmetics(get().workspacePrefs.unlocked_cosmetics, ctx)
    if (merged.length === get().workspacePrefs.unlocked_cosmetics.length)
    {
      return
    }
    await get().patchWorkspacePrefs({ unlocked_cosmetics: merged })
  },

  equipCosmetic: async (cosmeticId) =>
  {
    const item = getCosmeticById(cosmeticId)
    if (!item)
    {
      return false
    }

    const ctx = {
      level: get().userStats?.level ?? 1,
      streakCount: get().streakCount,
    }

    if (!isCosmeticUnlocked(item, ctx, get().workspacePrefs.unlocked_cosmetics))
    {
      return false
    }

    if (item.category === 'accent')
    {
      const accent = accentIdFromCosmetic(cosmeticId)
      if (!accent)
      {
        return false
      }
      await get().patchWorkspacePrefs({ accent })
      return true
    }

    const field = activeFieldForCategory(item.category)
    if (!field)
    {
      return false
    }

    const active: ActiveCosmetics = {
      ...get().workspacePrefs.active_cosmetics,
      [field]: cosmeticId === 'frame_none' || cosmeticId === 'aura_none' ? null : cosmeticId,
    }

    await get().patchWorkspacePrefs({ active_cosmetics: active })
    return true
  },

  purchaseCosmeticWithXp: async (cosmeticId) =>
  {
    const item = getCosmeticById(cosmeticId)
    if (!item || item.unlock.type !== 'xp' || !item.unlock.costXp)
    {
      return { ok: false, message: 'Item indisponível' }
    }

    if (get().workspacePrefs.unlocked_cosmetics.includes(cosmeticId))
    {
      return { ok: false, message: 'Você já possui este item' }
    }

    const spent = await get().spendXp(item.unlock.costXp)
    if (!spent)
    {
      return { ok: false, message: 'XP insuficiente' }
    }

    const unlocked = [...get().workspacePrefs.unlocked_cosmetics, cosmeticId]
    await get().patchWorkspacePrefs({ unlocked_cosmetics: unlocked })
    return { ok: true, message: `${item.label} desbloqueado!` }
  },
})
