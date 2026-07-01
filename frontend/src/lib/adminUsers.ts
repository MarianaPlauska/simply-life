// Acesso administrativo — lista de usuários (cartões públicos) para contas admin
import { supabase } from './supabase'

export interface AdminUserCard
{
  user_id: string
  display_name: string
  axel_calls_you: string
  accent: string
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
    // Coluna is_admin ainda não migrada ou offline
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
      .select('user_id, display_name, axel_calls_you, accent, level, streak_count, is_admin, updated_at')
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
