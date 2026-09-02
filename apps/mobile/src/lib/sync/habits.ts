import { supabase } from '../supabase'
import type { HabitoDiario } from '@simply-life/shared'
import { AGUA_META_COPOS, PROTEINA_META_G } from '@simply-life/shared'

function mapHabito(row: Record<string, unknown>): HabitoDiario
{
  const tipo = String(row.tipo || 'outro')
  return {
    id: String(row.id),
    tipo,
    nome: String(row.nome_exibicao || row.nome || tipo),
    metaDiaria: Number(row.meta_diaria) || (tipo === 'agua' ? AGUA_META_COPOS : tipo === 'proteina' ? PROTEINA_META_G : 1),
    progressoAtual: Number(row.progresso_atual) || 0,
    unidade: String(row.unidade || (tipo === 'agua' ? 'copos' : tipo === 'proteina' ? 'g' : 'un')),
  }
}

export async function fetchHabitos(): Promise<HabitoDiario[]>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const { data, error } = await supabase
    .from('habitos_diarios')
    .select('*')
    .eq('user_id', uid)
    .limit(50)

  if (error) throw new Error(error.message)
  return (data || []).map((r) => mapHabito(r as Record<string, unknown>))
}

export async function bumpHabitoProgress(
  habitId: string,
  progressoAtual: number,
): Promise<void>
{
  const { error } = await supabase
    .from('habitos_diarios')
    .update({ progresso_atual: progressoAtual })
    .eq('id', Number(habitId))

  if (error) throw new Error(error.message)
}
