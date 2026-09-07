import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { parseNotifyCadence, type NotifyCadence } from '@simply-life/shared'
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
  /** Card AXEL da Home recolhido — sincroniza na conta */
  axel_home_collapsed?: boolean
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
  /** Ritmo das mensagens do AXEL (onboarding) */
  care_pace?: 'calm' | 'balanced' | 'direct'
  /** Teto de push. off = sem alerta no celular. */
  notify_cadence?: NotifyCadence
  /** Opt-in: apoio a foco / TDAH (não é diagnóstico). */
  adhd_support?: boolean
  /** calm = gamificação discreta; rpg = trilha visível na Home. */
  gamification_mode?: 'calm' | 'rpg'
  /** Ordem dos módulos na Home (onboarding). */
  home_module_order?: DashboardPriority[]
  /** Meta semanal ou mensal escolhida pelo usuário. */
  life_goal?: import('@simply-life/shared').LifeGoal | null
  /** Semana (domingo ISO) em que o relatório de humor foi dispensado. */
  mood_report_dismissed_week?: string | null
  /** Wizard Montar seu AXEL concluído */
  setup_completed_at?: string | null
}

export const DEFAULT_WORKSPACE_PREFS: WorkspacePrefs = {
  display_name: '',
  axel_calls_you: '',
  axel_home_collapsed: false,
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
  care_pace: 'balanced',
  notify_cadence: 'off',
  adhd_support: false,
  gamification_mode: 'calm',
  setup_completed_at: null,
}

const LOCAL_KEY = 'simply-life-mobile-workspace-prefs'
/** Chave curta - lida no primeiro paint, sem esperar o JSON completo. */
export const COLOR_SCHEME_STORAGE_KEY = 'simply-life-color-scheme'

let memoryPrefs: WorkspacePrefs | null = null

function parseColorScheme(value: unknown): 'light' | 'dark' | null
{
  return value === 'light' || value === 'dark' ? value : null
}

/** Leitura síncrona (web + cache). Native espera o hydrate. */
export function readColorSchemeSync(): 'light' | 'dark' | null
{
  const fromMemory = parseColorScheme(memoryPrefs?.color_scheme)
  if (fromMemory) return fromMemory
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      const dedicated = parseColorScheme(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY))
      if (dedicated) return dedicated
      const raw = localStorage.getItem(LOCAL_KEY)
      if (raw)
      {
        return parseColorScheme((JSON.parse(raw) as Partial<WorkspacePrefs>).color_scheme)
      }
    }
  }
  catch
  {
    /* Safari privado / quota */
  }
  return null
}

function persistColorSchemeNow(scheme: 'light' | 'dark'): void
{
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, scheme)
    }
  }
  catch
  {
    /* ignore */
  }
  if (Platform.OS !== 'web')
  {
    void SecureStore.setItemAsync(COLOR_SCHEME_STORAGE_KEY, scheme)
  }
}

function readLocalSync(): Partial<WorkspacePrefs> | null
{
  if (memoryPrefs) return memoryPrefs
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

async function readLocal(): Promise<Partial<WorkspacePrefs> | null>
{
  const sync = readLocalSync()
  if (sync) return sync
  if (Platform.OS === 'web') return null
  try
  {
    const [prefsRaw, schemeRaw] = await Promise.all([
      SecureStore.getItemAsync(LOCAL_KEY),
      SecureStore.getItemAsync(COLOR_SCHEME_STORAGE_KEY),
    ])
    const parsed = prefsRaw
      ? (JSON.parse(prefsRaw) as Partial<WorkspacePrefs>)
      : {}
    const scheme = parseColorScheme(schemeRaw)
    if (scheme) parsed.color_scheme = scheme
    return Object.keys(parsed).length > 0 || scheme ? parsed : null
  }
  catch
  {
    return null
  }
}

function writeLocal(prefs: WorkspacePrefs): void
{
  memoryPrefs = prefs
  persistColorSchemeNow(prefs.color_scheme === 'dark' ? 'dark' : 'light')
  const payload = JSON.stringify(prefs)
  try
  {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined')
    {
      localStorage.setItem(LOCAL_KEY, payload)
      return
    }
    void SecureStore.setItemAsync(LOCAL_KEY, payload)
  }
  catch
  {
    /* ignore */
  }
}

function mergePrefs(raw: Partial<WorkspacePrefs> | null | undefined): WorkspacePrefs
{
  const scheme =
    parseColorScheme(raw?.color_scheme)
    ?? readColorSchemeSync()
    ?? DEFAULT_WORKSPACE_PREFS.color_scheme
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
    care_pace:
      raw?.care_pace === 'calm' || raw?.care_pace === 'direct' || raw?.care_pace === 'balanced'
        ? raw.care_pace
        : 'balanced',
    notify_cadence:
      parseNotifyCadence(raw?.notify_cadence)
      ?? (raw?.setup_completed_at ? 'once' : DEFAULT_WORKSPACE_PREFS.notify_cadence),
    adhd_support: Boolean(raw?.adhd_support),
    gamification_mode:
      raw?.gamification_mode === 'rpg' ? 'rpg' : 'calm',
    home_module_order:
      raw?.home_module_order?.length
        ? raw.home_module_order
        : undefined,
    life_goal: raw?.life_goal ?? null,
    mood_report_dismissed_week: raw?.mood_report_dismissed_week ?? null,
    color_scheme: scheme,
  }
}

/** Primeiro paint: localStorage no web, default no native até o hydrate. */
export function initialWorkspacePrefs(): WorkspacePrefs
{
  return mergePrefs(readLocalSync())
}

export async function loadWorkspacePrefs(): Promise<WorkspacePrefs>
{
  const local = await readLocal()
  if (!supabaseConfigured)
  {
    const merged = mergePrefs(local)
    writeLocal(merged)
    return merged
  }

  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid)
    {
      const merged = mergePrefs(local)
      writeLocal(merged)
      return merged
    }

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
    const merged = mergePrefs(local)
    writeLocal(merged)
    return merged
  }
}

export async function saveWorkspacePrefs(patch: Partial<WorkspacePrefs>): Promise<WorkspacePrefs>
{
  const current = mergePrefs(await readLocal())
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
    const nome =
      merged.axel_calls_you.trim()
      || merged.display_name.trim()
    if (nome)
    {
      await supabase
        .from('user_public_cards')
        .update({
          display_name: merged.display_name.trim() || nome,
          axel_calls_you: merged.axel_calls_you.trim() || nome,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', uid)
    }
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
