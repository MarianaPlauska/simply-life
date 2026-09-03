/**
 * Insere tarefa triada no Supabase.
 * Dedup por (user_id, external_ref) - mesma mensagem IMAP/webhook não vira duas tasks.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function insertTriagedTask(supabase, userId, item, scored, extra = {})
{
  const extraRest = { ...extra }
  const externalRef = extraRest.external_ref
    || item.external_ref
    || item.message_id
    || null
  delete extraRest.external_ref

  if (externalRef)
  {
    const { data: existing } = await supabase
      .from('tarefas_unificadas')
      .select('id, titulo, score_urgencia, prioridade')
      .eq('user_id', userId)
      .eq('external_ref', String(externalRef))
      .is('deletado_em', null)
      .maybeSingle()

    if (existing)
    {
      return { data: existing, error: null, duplicate: true }
    }
  }

  const { data, error } = await supabase
    .from('tarefas_unificadas')
    .insert({
      user_id: userId,
      titulo: scored.titulo,
      descricao: item.body || item.subject || null,
      snippet_100_char: scored.snippet,
      score_urgencia: scored.finalScore,
      status: 'pendente',
      prioridade: scored.prioridade,
      origem: item.origem || scored.itemOrigem || 'webhook',
      external_ref: externalRef ? String(externalRef) : null,
      ...extraRest,
    })
    .select('id, titulo, score_urgencia, prioridade')
    .single()

  if (error?.code === '23505' && externalRef)
  {
    const { data: existing } = await supabase
      .from('tarefas_unificadas')
      .select('id, titulo, score_urgencia, prioridade')
      .eq('user_id', userId)
      .eq('external_ref', String(externalRef))
      .is('deletado_em', null)
      .maybeSingle()
    return { data: existing, error: existing ? null : error, duplicate: true }
  }

  return { data, error, duplicate: false }
}
