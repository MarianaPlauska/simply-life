import { supabase } from './supabase'

/** Headers com JWT da sessão — rotas /api que exigem usuário autenticado */
export async function supabaseAuthHeaders(): Promise<Record<string, string>>
{
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (session?.access_token)
  {
    headers.Authorization = `Bearer ${session.access_token}`
  }

  return headers
}
