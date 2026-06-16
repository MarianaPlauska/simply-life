import { supabase } from './supabase'
import type { ActiveCosmetics } from './axelCosmetics'
import { DEFAULT_ACTIVE_COSMETICS } from './axelCosmetics'

// Preferências de workspace — wizard, cor, ordem, privacidade social

export type AccentId = 'copper' | 'sky' | 'forest' | 'violet'
export type DashboardPriority = 'finance' | 'tasks' | 'health'
export type MascotMoodPref = 'cheerful' | 'calm' | 'focused'

export interface UserWorkspacePrefs
{
  setup_completed_at: string | null
  display_name: string
  axel_calls_you: string
  accent: AccentId
  mascot_mood: MascotMoodPref
  dashboard_priority: DashboardPriority
  month_goal_amount: number | null
  ai_coach_enabled: boolean
  unlocked_cosmetics: string[]
  active_cosmetics: ActiveCosmetics
  privacy: {
    show_streak_to_friends: boolean
    show_level: boolean
    show_episode: boolean
  }
}

export const ACCENT_PALETTES: Record<AccentId, { label: string; light: string; dark: string; hover: string }> = {
  copper: { label: 'Cobre', light: '#9A5B1A', dark: '#C17F3A', hover: '#D4924A' },
  sky: { label: 'Céu', light: '#1D6FA4', dark: '#38A3E8', hover: '#5BB8F0' },
  forest: { label: 'Floresta', light: '#3D6B4F', dark: '#4A7C59', hover: '#5C9468' },
  violet: { label: 'Violeta', light: '#5B4B8A', dark: '#8B7CF6', hover: '#A394F8' },
}

export const DEFAULT_WORKSPACE_PREFS: UserWorkspacePrefs = {
  setup_completed_at: null,
  display_name: '',
  axel_calls_you: '',
  accent: 'copper',
  mascot_mood: 'calm',
  dashboard_priority: 'tasks',
  month_goal_amount: null,
  ai_coach_enabled: true,
  unlocked_cosmetics: ['accent_copper', 'mascot_default'],
  active_cosmetics: { ...DEFAULT_ACTIVE_COSMETICS },
  privacy: {
    show_streak_to_friends: true,
    show_level: true,
    show_episode: true,
  },
}

const LOCAL_KEY = 'simply-life-workspace-prefs'

function mergePrefs(raw: Partial<UserWorkspacePrefs> | null | undefined): UserWorkspacePrefs
{
  return {
    ...DEFAULT_WORKSPACE_PREFS,
    ...raw,
    privacy: {
      ...DEFAULT_WORKSPACE_PREFS.privacy,
      ...(raw?.privacy ?? {}),
    },
    unlocked_cosmetics: raw?.unlocked_cosmetics ?? DEFAULT_WORKSPACE_PREFS.unlocked_cosmetics,
    active_cosmetics: {
      ...DEFAULT_ACTIVE_COSMETICS,
      ...(raw?.active_cosmetics ?? {}),
    },
  }
}

export function isSetupComplete(prefs: UserWorkspacePrefs | null | undefined): boolean
{
  return Boolean(prefs?.setup_completed_at)
}

export async function loadWorkspacePrefs(): Promise<UserWorkspacePrefs>
{
  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      const raw = localStorage.getItem(LOCAL_KEY)
      return mergePrefs(raw ? JSON.parse(raw) as Partial<UserWorkspacePrefs> : {})
    }

    const { data, error } = await supabase
      .from('user_workspace_prefs')
      .select('prefs')
      .eq('user_id', uid)
      .maybeSingle()

    if (error) throw error
    const merged = mergePrefs((data?.prefs ?? {}) as Partial<UserWorkspacePrefs>)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(merged))
    return merged
  }
  catch
  {
    const raw = localStorage.getItem(LOCAL_KEY)
    return mergePrefs(raw ? JSON.parse(raw) as Partial<UserWorkspacePrefs> : {})
  }
}

export async function saveWorkspacePrefs(patch: Partial<UserWorkspacePrefs>): Promise<UserWorkspacePrefs>
{
  const current = await loadWorkspacePrefs()
  const merged = mergePrefs({ ...current, ...patch })
  localStorage.setItem(LOCAL_KEY, JSON.stringify(merged))

  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return merged

    await supabase.from('user_workspace_prefs').upsert({
      user_id: uid,
      prefs: merged,
      updated_at: new Date().toISOString(),
    })

    await syncPublicCard(uid, merged)
  }
  catch
  {
    /* offline */
  }

  return merged
}

export async function syncPublicCard(userId: string, prefs: UserWorkspacePrefs): Promise<void>
{
  const { data: stats } = await supabase
    .from('user_stats')
    .select('level, ofensiva_streak')
    .eq('id', userId)
    .maybeSingle()

  await supabase.from('user_public_cards').upsert({
    user_id: userId,
    display_name: prefs.display_name,
    axel_calls_you: prefs.axel_calls_you || prefs.display_name,
    accent: prefs.accent,
    mascot_mood: prefs.mascot_mood,
    level: stats?.level ?? 1,
    streak_count: stats?.ofensiva_streak ?? 0,
    updated_at: new Date().toISOString(),
  })
}
