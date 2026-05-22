/**
 * Insere tarefa triada no Supabase.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function insertTriagedTask(supabase, userId, item, scored, extra = {})
{
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
      ...extra,
    })
    .select('id, titulo, score_urgencia, prioridade')
    .single();

  return { data, error };
}
