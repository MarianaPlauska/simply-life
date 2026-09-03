// cliente supabase - ponto central de acesso ao banco e auth
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey)
{
  throw new Error(
    'variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas no .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})

/** URL de retorno após OAuth (Google) - deve estar nas Redirect URLs do Supabase */
export function getAuthCallbackUrl(): string
{
  return `${window.location.origin}/auth/callback`
}
