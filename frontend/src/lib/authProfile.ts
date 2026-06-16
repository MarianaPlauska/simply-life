// helpers de perfil após autenticação supabase
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function resolveDisplayName(user: User): Promise<string>
{
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_completo')
    .eq('id', user.id)
    .maybeSingle()

  const meta = user.user_metadata || {}
  return (
    profile?.nome_completo
    || meta.nome_completo
    || meta.full_name
    || meta.name
    || user.email?.split('@')[0]
    || ''
  )
}

export async function applySessionToStore(
  session: Session,
  login: (email: string, nome: string, id: string) => void,
): Promise<void>
{
  const nome = await resolveDisplayName(session.user)
  login(session.user.email || '', nome, session.user.id)
}
