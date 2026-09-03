import { Platform } from 'react-native'
import { supabase, supabaseConfigured } from '../supabase'
import {
  defaultWidgetsForPriority,
  type DashboardPriority,
  type DashboardWidgetId,
} from '../dashboardWidgets'
import {
  DEFAULT_HOME_METRICS,
  normalizeHomeMetrics,
  type HomeMetricId,
} from '../homeMetrics'

export type WorkspacePrefs = {
  display_name: string
  axel_calls_you: string
  /** Telefone / cidade - sync nuvem futuro */
  profile_phone?: string
  profile_city?: string
  /** Cor do avatar (hex) - sem upload de foto ainda */
  profile_avatar_tint?: string
  dashboard_priority: DashboardPriority
  dashboard_quick_widgets?: DashboardWidgetId[]
  /** Atalhos da linha compacta da Home */
  home_metric_cards?: HomeMetricId[]
  /** ISO - preenchido ao salvar "Personalize seu Início" */
  home_metrics_configured_at?: string | null
  color_scheme?: 'light' | 'dark'
  /** Acessibilidade - aplicados no cliente; sync nuvem no futuro */
  a11y_large_text?: boolean
  a11y_reduce_motion?: boolean
  a11y_high_contrast?: boolean
  /** Opt-in futuro: sincronizar perfil/prefs na nuvem */
  cloud_sync_opt_in?: boolean
  ai_coach_enabled: boolean
  pomodoro_focus: number
  pomodoro_short: number
  pomodoro_long: number
  pinned_modules: string[]
  /** Sidebar desktop colapsada (só ícones) */
  sidebar_collapsed?: boolean
  /** Wizard Montar seu AXEL concluído */
  setup_completed_at?: string | null
}

export const DEFAULT_WORKSPACE_PREFS: WorkspacePrefs = {
  display_name: '',
  axel_calls_you: '',
  profile_phone: '',
  profile_city: '',
  profile_avatar_tint: '#E8734A',
  dashboard_priority: 'tasks',
  dashboard_quick_widgets: defaultWidgetsForPriority('tasks'),
  home_metric_cards: [...DEFAULT_HOME_METRICS],
  home_metrics_configured_at: null,
  /** Natural Tan - claro por padrão */
  color_scheme: 'light',
  a11y_large_text: false,
  a11y_reduce_motion: false,
  a11y_high_contrast: false,
  cloud_sync_opt_in: false,
  ai_coach_enabled: true,
  pomodoro_focus: 25,
  pomodoro_short: 5,
  pomodoro_long: 15,
  pinned_modules: ['dashboard', 'kanban'],
  sidebar_collapsed: false,
  setup_completed_at: null,
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
    home_metric_cards: normalizeHomeMetrics(raw?.home_metric_cards),
    home_metrics_configured_at: raw?.home_metrics_configured_at ?? null,
    pinned_modules:
      raw?.pinned_modules?.length
        ? raw.pinned_modules
        : DEFAULT_WORKSPACE_PREFS.pinned_modules,
    setup_completed_at: raw?.setup_completed_at ?? null,
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
      ...local,
      ...(data?.prefs as Partial<WorkspacePrefs> | undefined),
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
