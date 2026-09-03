import { supabase } from './supabase'
import type { ActiveCosmetics } from './axelCosmetics'
import { DEFAULT_ACTIVE_COSMETICS } from './axelCosmetics'
import type { AvatarStyleId } from './axelAvatarPresets'
import type { DashboardWidgetId } from './dashboardWidgets'
import {
  defaultMobileNavForPriority,
  normalizeMobileNavModules,
  type MobileNavModuleId,
} from './mobileBottomNav'

// Preferências de workspace - wizard, cor, ordem, privacidade social

export type AccentId = 'meridian' | 'copper' | 'sky' | 'forest' | 'violet'
export type DashboardPriority = 'finance' | 'tasks' | 'health'
export type MascotMoodPref = 'cheerful' | 'calm' | 'focused'

export interface UserWorkspacePrefs
{
  setup_completed_at: string | null
  display_name: string
  axel_calls_you: string
  accent: AccentId
  /** Tema claro/escuro - backup na conta para sobreviver a limpeza do aparelho */
  color_scheme?: 'light' | 'dark'
  mascot_mood: MascotMoodPref
  avatar_style: AvatarStyleId
  dashboard_priority: DashboardPriority
  /** Até 3 atalhos de cadastro rápido no dashboard */
  dashboard_quick_widgets?: DashboardWidgetId[]
  /** Linha compacta da Home (Expo) - chaves humor|water|protein|tasks|finance|goals */
  home_metric_cards?: string[]
  home_metrics_configured_at?: string | null
  /** Módulos da barra inferior mobile - Home sempre incluso */
  mobile_bottom_nav?: MobileNavModuleId[]
  month_goal_amount: number | null
  ai_coach_enabled: boolean
  unlocked_cosmetics: string[]
  active_cosmetics: ActiveCosmetics
  privacy: {
    show_streak_to_friends: boolean
    show_level: boolean
    show_episode: boolean
  }
  /** Índice de rotação das frases AXEL - sincronizado via Supabase */
  axel_care_rotation?: Record<string, number>
  /** Oculta card de humor no dashboard até este instante (ISO) - regra: +12h após 1º registro do dia */
  wellbeing_dashboard_hidden_until?: string | null
}

export const ACCENT_PALETTES: Record<AccentId, { label: string; light: string; dark: string; hover: string }> = {
  meridian: { label: 'Meridiano', light: '#0D9488', dark: '#38B2AC', hover: '#2DD4BF' },
  copper: { label: 'Cobre', light: '#A05C3D', dark: '#FF6A2B', hover: '#FF8A4C' },
  sky: { label: 'Céu', light: '#1D6FA4', dark: '#38A3E8', hover: '#155A85' },
  forest: { label: 'Floresta', light: '#3D6B4F', dark: '#4A7C59', hover: '#5C9468' },
  violet: { label: 'Violeta', light: '#5B4B8A', dark: '#8B7CF6', hover: '#A394F8' },
}

export const DEFAULT_WORKSPACE_PREFS: UserWorkspacePrefs = {
  setup_completed_at: null,
  display_name: '',
  axel_calls_you: '',
  accent: 'copper',
  mascot_mood: 'calm',
  avatar_style: 'initials',
  dashboard_priority: 'tasks',
  month_goal_amount: null,
  ai_coach_enabled: true,
  unlocked_cosmetics: ['accent_meridian', 'mascot_default'],
  active_cosmetics: { ...DEFAULT_ACTIVE_COSMETICS },
  privacy: {
    show_streak_to_friends: true,
    show_level: true,
    show_episode: false,
  },
  axel_care_rotation: {},
  wellbeing_dashboard_hidden_until: null,
}

const LOCAL_KEY_PREFIX = 'simply-life-workspace-prefs'

function localKeyForUser(uid: string | null): string
{
  return uid ? `${LOCAL_KEY_PREFIX}:${uid}` : `${LOCAL_KEY_PREFIX}:anonymous`
}

async function resolveAuthUserId(): Promise<string | null>
{
  return (await supabase.auth.getUser()).data.user?.id ?? null
}

function readLocalPrefsForUser(uid: string | null): Partial<UserWorkspacePrefs> | null
{
  try
  {
    const raw = localStorage.getItem(localKeyForUser(uid))
    if (!raw) return null
    return JSON.parse(raw) as Partial<UserWorkspacePrefs>
  }
  catch
  {
    return null
  }
}

function writeLocalPrefsForUser(uid: string | null, prefs: UserWorkspacePrefs): void
{
  localStorage.setItem(localKeyForUser(uid), JSON.stringify(prefs))
}

/** Mantém o wizard concluído mesmo se o Supabase ainda não sincronizou */
function pickSetupCompletedAt(
  remote: string | null | undefined,
  local: string | null | undefined,
): string | null
{
  if (remote && local)
  {
    return new Date(remote) >= new Date(local) ? remote : local
  }
  return remote ?? local ?? null
}

function mergeRemoteWithLocal(
  remote: Partial<UserWorkspacePrefs>,
  local: Partial<UserWorkspacePrefs> | null,
): UserWorkspacePrefs
{
  const remoteMerged = mergePrefs(remote)
  const localMerged = mergePrefs(local ?? {})
  const setup_completed_at = pickSetupCompletedAt(
    remoteMerged.setup_completed_at,
    localMerged.setup_completed_at,
  )

  return mergePrefs({
    ...remoteMerged,
    ...localMerged,
    ...(setup_completed_at ? { setup_completed_at } : {}),
  })
}

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
    axel_care_rotation: raw?.axel_care_rotation ?? DEFAULT_WORKSPACE_PREFS.axel_care_rotation,
    wellbeing_dashboard_hidden_until:
      raw?.wellbeing_dashboard_hidden_until ?? DEFAULT_WORKSPACE_PREFS.wellbeing_dashboard_hidden_until,
    dashboard_quick_widgets: raw?.dashboard_quick_widgets,
    ...(raw?.color_scheme === 'light' || raw?.color_scheme === 'dark'
      ? { color_scheme: raw.color_scheme }
      : {}),
    mobile_bottom_nav: normalizeMobileNavModules(
      raw?.mobile_bottom_nav,
      raw?.dashboard_priority ?? DEFAULT_WORKSPACE_PREFS.dashboard_priority,
    ),
  }
}

export function defaultMobileBottomNav(priority: DashboardPriority = 'tasks'): MobileNavModuleId[]
{
  return defaultMobileNavForPriority(priority)
}

export function isSetupComplete(prefs: UserWorkspacePrefs | null | undefined): boolean
{
  return Boolean(prefs?.setup_completed_at)
}

export async function loadWorkspacePrefs(): Promise<UserWorkspacePrefs>
{
  const uid = await resolveAuthUserId()
  const local = readLocalPrefsForUser(uid)

  try
  {
    if (!uid)
    {
      return mergePrefs(local ?? {})
    }

    const { data, error } = await supabase
      .from('user_workspace_prefs')
      .select('prefs')
      .eq('user_id', uid)
      .maybeSingle()

    if (error) throw error

    const merged = mergeRemoteWithLocal(
      (data?.prefs ?? {}) as Partial<UserWorkspacePrefs>,
      local,
    )
    writeLocalPrefsForUser(uid, merged)
    return merged
  }
  catch
  {
    return mergePrefs(local ?? {})
  }
}

export async function saveWorkspacePrefs(patch: Partial<UserWorkspacePrefs>): Promise<UserWorkspacePrefs>
{
  const uid = await resolveAuthUserId()
  const local = readLocalPrefsForUser(uid)
  const merged = mergePrefs({ ...(local ?? {}), ...patch })
  writeLocalPrefsForUser(uid, merged)

  try
  {
    if (!uid) return merged

    await supabase.from('user_workspace_prefs').upsert({
      user_id: uid,
      prefs: merged,
      updated_at: new Date().toISOString(),
    })

    try
    {
      await syncPublicCard(uid, merged)
    }
    catch
    {
      /* cartão público opcional - migration 027/029 */
    }
  }
  catch
  {
    /* offline ou tabela ainda não migrada */
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
    avatar_style: prefs.avatar_style ?? 'initials',
    level: stats?.level ?? 1,
    streak_count: stats?.ofensiva_streak ?? 0,
    updated_at: new Date().toISOString(),
  })
}
