import { supabase } from './supabase'
import { extractDatesFromText, titleFromNoteText } from './noteDateExtraction'
import { useTaskStore } from '../store/useTaskStore'

function phantomKey(iso: string, title: string): string
{
  const slug = title.slice(0, 40).toLowerCase().replace(/\s+/g, '_')
  return `note_auto_${iso}_${slug}`
}

/** Cria tarefas no Kanban para cada data encontrada no texto */
export async function syncNoteDatesToKanban(
  text: string,
  titleHint?: string,
): Promise<number>
{
  const trimmed = text.trim()
  if (trimmed.length < 4) return 0

  const dates = extractDatesFromText(trimmed)
  if (dates.length === 0) return 0

  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return 0

  const tituloBase = titleHint?.trim() || titleFromNoteText(trimmed)
  let created = 0

  for (const iso of dates)
  {
    const key = phantomKey(iso, tituloBase)
    const { data: existing } = await supabase
      .from('tarefas_unificadas')
      .select('id')
      .eq('user_id', uid)
      .eq('snippet_100_char', key)
      .neq('status', 'concluida')
      .maybeSingle()

    if (existing) continue

    const { localScoreFromText } = await import('../utils/localScore')
    const { score, prioridade } = localScoreFromText(`${tituloBase} ${trimmed}`)

    const { data, error } = await supabase
      .from('tarefas_unificadas')
      .insert({
        user_id: uid,
        titulo: tituloBase,
        notas_locais: trimmed,
        data_vencimento: iso,
        score_urgencia: score,
        prioridade,
        origem: 'manual',
        status: 'pendente',
        snippet_100_char: key,
      })
      .select()
      .single()

    if (!error && data)
    {
      useTaskStore.setState((s) => ({
        tarefas: [{ ...data, subtarefas: [], labels: [] }, ...s.tarefas],
      }))
      created += 1
    }
  }

  return created
}
