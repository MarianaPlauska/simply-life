import { supabase } from '../supabase'

export type HabitHistoricoRow = {
  data: string
  concluido: number
}

export async function upsertHabitHistoricoCups(
  habitoId: string | number,
  cups: number,
  data: string,
): Promise<void>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return

  const { error } = await supabase.from('historico_habitos').upsert(
    {
      user_id: uid,
      habito_id: Number(habitoId),
      data,
      concluido: Math.max(0, cups),
    },
    { onConflict: 'habito_id,data' },
  )

  if (error) throw new Error(error.message)
}

export async function fetchHabitHistoricoRows(
  habitoId: string | number,
  fromIso: string,
): Promise<HabitHistoricoRow[]>
{
  const { data, error } = await supabase
    .from('historico_habitos')
    .select('data, concluido')
    .eq('habito_id', Number(habitoId))
    .gte('data', fromIso)

  if (error) throw new Error(error.message)
  return (data ?? []) as HabitHistoricoRow[]
}
