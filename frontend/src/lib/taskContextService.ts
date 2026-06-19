// Pastas/contextos — CRUD mínimo para o drawer

import { supabase } from './supabase'

export interface ContextoRow
{
  id: number
  titulo: string
  cor: string
}

export async function fetchUserContextos(): Promise<ContextoRow[]>
{
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []

  const { data, error } = await supabase
    .from('contextos')
    .select('id, titulo, cor')
    .order('titulo')

  if (error)
  {
    console.error('fetchUserContextos:', error)
    return []
  }
  return data ?? []
}

export async function createContexto(titulo: string, cor: string): Promise<ContextoRow | null>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null

  const { data, error } = await supabase
    .from('contextos')
    .insert({ user_id: uid, titulo, cor })
    .select('id, titulo, cor')
    .single()

  if (error)
  {
    console.error('createContexto:', error)
    return null
  }
  return data
}

export async function setTaskContexto(
  tarefaId: number,
  contexto: { id: number; titulo: string; cor: string } | null,
): Promise<boolean>
{
  const { error: delError } = await supabase
    .from('contexto_itens')
    .delete()
    .eq('tarefa_id', tarefaId)

  if (delError)
  {
    console.error('setTaskContexto delete:', delError)
    return false
  }

  if (!contexto) return true

  const { error: insError } = await supabase
    .from('contexto_itens')
    .insert({
      contexto_id: contexto.id,
      tarefa_id: tarefaId,
      tipo_item: 'tarefa',
    })

  if (insError)
  {
    console.error('setTaskContexto insert:', insError)
    return false
  }
  return true
}
