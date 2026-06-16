import { supabase } from './supabase'
import { localTodayIso } from './healthDayBoundary'

/** Registra conclusão diária do hábito — alimenta streaks e weekly review */
export async function upsertHabitHistorico(
  habitoId: number,
  concluido: boolean,
  data = localTodayIso(),
): Promise<void>
{
  try
  {
    const uid = (await supabase.auth.getUser()).data.user?.id
    if (!uid) return

    await supabase.from('historico_habitos').upsert(
      {
        user_id: uid,
        habito_id: habitoId,
        data,
        concluido: concluido ? 1 : 0,
      },
      { onConflict: 'habito_id,data' },
    )
  }
  catch
  {
    /* offline */
  }
}
