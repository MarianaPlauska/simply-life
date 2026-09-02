import { supabase, supabaseConfigured } from '../supabase'

export type AnotacaoTipo = 'diario' | 'lembrete' | 'lista'

export type Anotacao = {
  id: number
  user_id: string
  titulo: string | null
  conteudo: string
  fixado: number
  categoria: string
}

export async function fetchAnotacoes(): Promise<Anotacao[]>
{
  if (!supabaseConfigured) return []
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return []
  const { data, error } = await supabase
    .from('anotacoes')
    .select('*')
    .eq('user_id', uid)
    .order('fixado', { ascending: false })
    .order('id', { ascending: false })
  if (error) throw error
  return (data ?? []) as Anotacao[]
}

export async function insertAnotacao(tipo: AnotacaoTipo = 'diario'): Promise<Anotacao | null>
{
  if (!supabaseConfigured) return null
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return null
  const defaults: Record<AnotacaoTipo, { titulo: string; conteudo: string }> = {
    diario: { titulo: 'Diário', conteudo: '' },
    lembrete: { titulo: 'Lembrete', conteudo: '' },
    lista: { titulo: 'Lista', conteudo: '- [ ] \n- [ ] ' },
  }
  const base = defaults[tipo]
  const { data, error } = await supabase
    .from('anotacoes')
    .insert({
      user_id: uid,
      titulo: base.titulo,
      conteudo: base.conteudo,
      categoria: tipo,
    })
    .select()
    .single()
  if (error) throw error
  return data as Anotacao
}

export async function patchAnotacao(
  id: number,
  patch: Partial<Pick<Anotacao, 'titulo' | 'conteudo' | 'categoria' | 'fixado'>>,
): Promise<void>
{
  if (!supabaseConfigured) return
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return
  const { error } = await supabase
    .from('anotacoes')
    .update(patch)
    .eq('id', id)
    .eq('user_id', uid)
  if (error) throw error
}

export async function removeAnotacao(id: number): Promise<void>
{
  if (!supabaseConfigured) return
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return
  const { error } = await supabase.from('anotacoes').delete().eq('id', id).eq('user_id', uid)
  if (error) throw error
}
