// Labels de projeto — vincula tag SST/FINALLY após ingestão

const TAG_COLORS = {
  SST: '#ef4444',
  FINALLY: '#8b5cf6',
  HUB: '#3b82f6',
  CORE: '#10b981',
};

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function ensureProjectLabel(supabase, userId, tagName)
{
  const nome = String(tagName || '').toUpperCase();
  if (!nome) return null;

  const { data: existing } = await supabase
    .from('labels')
    .select('id, nome, cor')
    .eq('user_id', userId)
    .ilike('nome', nome)
    .maybeSingle();

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from('labels')
    .insert({
      user_id: userId,
      nome,
      cor: TAG_COLORS[nome] || '#6366f1',
    })
    .select('id, nome, cor')
    .single();

  if (error)
  {
    console.warn('[projectLabels] insert label:', error.message);
    return null;
  }

  return created;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function linkLabelToTask(supabase, tarefaId, labelId)
{
  const { error } = await supabase
    .from('tarefa_labels')
    .insert({ tarefa_id: tarefaId, label_id: labelId });

  if (error && !error.message?.includes('duplicate'))
  {
    console.warn('[projectLabels] link:', error.message);
  }
}
