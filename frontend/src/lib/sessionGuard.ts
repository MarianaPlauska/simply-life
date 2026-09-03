// helper de sessão - evita 401 em queries sem auth
import { supabase } from './supabase'

// retorna o uid se logado, null se não
export async function getSessionUid(): Promise<string | null>
{
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}
