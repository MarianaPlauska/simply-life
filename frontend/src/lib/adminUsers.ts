// Acesso administrativo — lista de usuários (cartões públicos) para contas admin
import { supabase } from './supabase'
import { supabaseAuthHeaders } from './supabaseAuthHeaders'
import {
  DEFAULT_WORKSPACE_PREFS,
  type DashboardPriority,
  type UserWorkspacePrefs,
} from './userWorkspacePrefs'
import type { AvatarStyleId } from './axelAvatarPresets'
import type { DashboardWidgetId } from './dashboardWidgets'

export interface AdminUserCard
{
  user_id: string
  display_name: string
  axel_calls_you: string
  accent: string
  avatar_style: string
  level: number
  streak_count: number
  is_admin: boolean
  updated_at: string
}

/** Verdadeiro quando a conta logada está marcada como admin no cartão público */
export async function fetchIsAdmin(): Promise<boolean>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid)
  {
    return false
  }
  try
  {
    const { data: rpcAdmin, error: rpcError } = await supabase.rpc('is_admin_user')
    if (!rpcError && typeof rpcAdmin === 'boolean')
    {
      return rpcAdmin
    }
  }
  catch
  {
    /* RPC ainda não migrada */
  }

  try
  {
    const { data, error } = await supabase
      .from('user_public_cards')
      .select('is_admin')
      .eq('user_id', uid)
      .maybeSingle()
    if (error) throw error
    return Boolean(data?.is_admin)
  }
  catch (e)
  {
    console.error('fetchIsAdmin:', e)
    return false
  }
}

/** Lista todos os usuários do sistema — só retorna dados se a RLS de admin permitir */
export async function fetchAllUserCards(): Promise<AdminUserCard[]>
{
  try
  {
    const { data, error } = await supabase
      .from('user_public_cards')
      .select('user_id, display_name, axel_calls_you, accent, avatar_style, level, streak_count, is_admin, updated_at')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as AdminUserCard[]
  }
  catch (e)
  {
    console.error('fetchAllUserCards:', e)
    return []
  }
}

function mergeAdminPrefs(raw: Partial<UserWorkspacePrefs> | null | undefined): UserWorkspacePrefs
{
  return {
    ...DEFAULT_WORKSPACE_PREFS,
    ...raw,
    privacy: {
      ...DEFAULT_WORKSPACE_PREFS.privacy,
      ...(raw?.privacy ?? {}),
    },
    active_cosmetics: {
      ...DEFAULT_WORKSPACE_PREFS.active_cosmetics,
      ...(raw?.active_cosmetics ?? {}),
    },
  }
}

/** Carrega prefs de workspace de um usuário (admin) */
export async function adminFetchUserPrefs(userId: string): Promise<UserWorkspacePrefs>
{
  const { data, error } = await supabase
    .from('user_workspace_prefs')
    .select('prefs')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return mergeAdminPrefs((data?.prefs ?? {}) as Partial<UserWorkspacePrefs>)
}

export interface AdminUserPrefsPatch
{
  display_name?: string
  avatar_style?: AvatarStyleId
  dashboard_priority?: DashboardPriority
  dashboard_quick_widgets?: DashboardWidgetId[]
}

/** Salva avatar e preferências de dashboard de um usuário (admin) */
export async function adminSaveUserPrefs(
  userId: string,
  card: AdminUserCard,
  patch: AdminUserPrefsPatch,
): Promise<void>
{
  const current = await adminFetchUserPrefs(userId)
  const merged = mergeAdminPrefs({
    ...current,
    display_name: patch.display_name ?? current.display_name,
    avatar_style: patch.avatar_style ?? current.avatar_style,
    dashboard_priority: patch.dashboard_priority ?? current.dashboard_priority,
    dashboard_quick_widgets: patch.dashboard_quick_widgets ?? current.dashboard_quick_widgets,
  })

  const { error: prefsError } = await supabase.from('user_workspace_prefs').upsert({
    user_id: userId,
    prefs: merged,
    updated_at: new Date().toISOString(),
  })
  if (prefsError) throw prefsError

  const { error: cardError } = await supabase
    .from('user_public_cards')
    .update({
      display_name: patch.display_name ?? card.display_name,
      axel_calls_you: patch.display_name ?? card.axel_calls_you ?? card.display_name,
      avatar_style: patch.avatar_style ?? current.avatar_style,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (cardError) throw cardError
}

/** Exclui conta de usuário — requer service role no servidor */
export async function adminDeleteUser(userId: string): Promise<void>
{
  const headers = await supabaseAuthHeaders()
  const res = await fetch('/api/axel/admin-users', {
    method: 'POST',
    headers,
    body: JSON.stringify({ action: 'delete', userId }),
  })

  const body = await res.json().catch(() => ({})) as { error?: string }
  if (!res.ok)
  {
    throw new Error(body.error || 'Falha ao excluir usuário')
  }
}
