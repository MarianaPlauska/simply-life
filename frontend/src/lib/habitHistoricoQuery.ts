import { supabase } from './supabase'

export function weeksAgoIso(weeks: number): string
{
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - weeks * 7)
  return d.toISOString().slice(0, 10)
}

export interface HabitHistoricoRow
{
  data: string
  concluido: number
}

/** Histórico diário de um hábito — últimas N semanas */
export async function fetchHabitHistoricoRows(
  habitoId: number,
  weeks = 12,
): Promise<HabitHistoricoRow[]>
{
  const { data, error } = await supabase
    .from('historico_habitos')
    .select('data, concluido')
    .eq('habito_id', habitoId)
    .gte('data', weeksAgoIso(weeks))

  if (error) throw error
  return (data ?? []) as HabitHistoricoRow[]
}
