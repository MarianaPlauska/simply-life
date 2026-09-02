import { Platform } from 'react-native'
import { supabase, supabaseConfigured } from '../supabase'
import {
  defaultWidgetsForPriority,
  type DashboardPriority,
  type DashboardWidgetId,
} from '../dashboardWidgets'

export type WorkspacePrefs = {
  display_name: string
  axel_calls_you: string
  dashboard_priority: DashboardPriority
  dashboard_quick_widgets?: DashboardWidgetId[]
  color_scheme?: 'light' | 'dark'
  ai_coach_enabled: boolean
  pomodoro_focus: number
  pomodoro_short: number
  pomodoro_long: number
  pinned_modules: string[]
}

export const DEFAULT_WORKSPACE_PREFS: WorkspacePrefs = {
  display_name: '',
  axel_calls_you: '',
  dashboard_priority: 'tasks',
  dashboard_quick_widgets: defaultWidgetsForPriority('tasks'),
  ai_coach_enabled: true,
  pomodoro_focus: 25,
  pomodoro_short: 5,
  pomodoro_long: 15,
  pinned_modules: ['dashboard', 'kanban'],
}

const LOCAL_KEY = 'simply-life-mobile-workspace-prefs'

function readLocal(): Partial<WorkspacePrefs> | null
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      const raw = localStorage.getItem(LOCAL_KEY)
      return raw ? (JSON.parse(raw) as Partial<WorkspacePrefs>) : null
    }
  }
  catch
  {
    /* ignore */
  }
  return null
}

function writeLocal(prefs: WorkspacePrefs): void
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(prefs))
    }
  }
  catch
  {
    /* ignore */
  }
}

function mergePrefs(raw: Partial<WorkspacePrefs> | null | undefined): WorkspacePrefs
{
  return {
    ...DEFAULT_WORKSPACE_PREFS,
    ...raw,
    dashboard_quick_widgets:
      raw?.dashboard_quick_widgets?.length
        ? raw.dashboard_quick_widgets
        : DEFAULT_WORKSPACE_PREFS.dashboard_quick_widgets,
    pinned_modules:
      raw?.pinned_modules?.length
        ? raw.pinned_modules
        : DEFAULT_WORKSPACE_PREFS.pinned_modules,
  }
}

export async function loadWorkspacePrefs(): Promise<WorkspacePrefs>
{
  const local = readLocal()
  if (!supabaseConfigured)
  {
    return mergePrefs(local)
  }

  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return mergePrefs(local)

    const { data, error } = await supabase
      .from('user_workspace_prefs')
      .select('prefs')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) throw error

    const merged = mergePrefs({
      ...(data?.prefs as Partial<WorkspacePrefs> | undefined),
      ...local,
    })
    writeLocal(merged)
    return merged
  }
  catch
  {
    return mergePrefs(local)
  }
}

export async function saveWorkspacePrefs(patch: Partial<WorkspacePrefs>): Promise<WorkspacePrefs>
{
  const current = mergePrefs(readLocal())
  const merged = mergePrefs({ ...current, ...patch })
  writeLocal(merged)

  if (!supabaseConfigured) return merged

  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return merged
    await supabase.from('user_workspace_prefs').upsert({
      user_id: uid,
      prefs: merged,
      updated_at: new Date().toISOString(),
    })
  }
  catch
  {
    /* offline */
  }

  return merged
}

export async function loadEmailKeywords(): Promise<string[]>
{
  if (!supabaseConfigured) return []
  try
  {
    const { data, error } = await supabase
      .from('preferencias_usuario')
      .select('palavras_chave_email, modulos_fixados')
      .maybeSingle()
    if (error) throw error
    const raw = (data?.palavras_chave_email as string | null) || ''
    return raw.split(',').map((s) => s.trim()).filter(Boolean)
  }
  catch
  {
    return []
  }
}

export async function saveEmailKeywords(palavras: string[]): Promise<void>
{
  if (!supabaseConfigured) return
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return
  await supabase
    .from('preferencias_usuario')
    .upsert(
      { user_id: uid, palavras_chave_email: palavras.join(',') },
      { onConflict: 'user_id' },
    )
}

export async function savePinnedModules(modules: string[]): Promise<void>
{
  if (!supabaseConfigured) return
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return
  await supabase
    .from('preferencias_usuario')
    .upsert(
      { user_id: uid, modulos_fixados: modules.join(',') },
      { onConflict: 'user_id' },
    )
}

export type RadarKeyword = { id: number; termo: string; peso: number }

export async function loadRadarKeywords(): Promise<RadarKeyword[]>
{
  if (!supabaseConfigured) return []
  try
  {
    const { data, error } = await supabase.from('palavras_chave').select('*')
    if (error) throw error
    return (data ?? []) as RadarKeyword[]
  }
  catch
  {
    return []
  }
}

export async function addRadarKeyword(termo: string, peso = 1): Promise<RadarKeyword | null>
{
  if (!supabaseConfigured) return null
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null
  const { data, error } = await supabase
    .from('palavras_chave')
    .insert({ user_id: uid, termo, peso })
    .select()
    .single()
  if (error) return null
  return data as RadarKeyword
}

export async function removeRadarKeyword(id: number): Promise<void>
{
  if (!supabaseConfigured) return
  await supabase.from('palavras_chave').delete().eq('id', id)
}
