import { supabase } from '../supabase'
import type { HabitoDiario } from '@simply-life/shared'
import { AGUA_META_COPOS, PROTEINA_META_G, aguaMlPorCopo } from '@simply-life/shared'

function mapHabito(row: Record<string, unknown>): HabitoDiario
{
  const tipo = String(row.tipo || 'outro')
  const config =
    row.config && typeof row.config === 'object' && !Array.isArray(row.config)
      ? (row.config as Record<string, unknown>)
      : {}
  const mapped: HabitoDiario = {
    id: String(row.id),
    tipo,
    nome: String(row.nome_exibicao || row.nome || tipo),
    metaDiaria: Number(row.meta_diaria) || (tipo === 'agua' ? AGUA_META_COPOS : tipo === 'proteina' ? PROTEINA_META_G : 1),
    progressoAtual: Number(row.progresso_atual) || 0,
    unidade: String(row.unidade || (tipo === 'agua' ? 'copos' : tipo === 'proteina' ? 'g' : 'un')),
    config,
  }
  if (tipo === 'agua') mapped.mlPorCopo = aguaMlPorCopo(mapped)
  return mapped
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

export async function patchHabitoAgua(
  habitId: string,
  patch: { progressoAtual?: number; metaDiaria?: number; mlPorCopo?: number },
  currentConfig?: Record<string, unknown>,
): Promise<void>
{
  const payload: Record<string, unknown> = {}
  if (patch.progressoAtual != null) payload.progresso_atual = patch.progressoAtual
  if (patch.metaDiaria != null) payload.meta_diaria = patch.metaDiaria
  if (patch.mlPorCopo != null)
  {
    payload.config = { ...(currentConfig ?? {}), ml_por_copo: patch.mlPorCopo }
  }

  const { error } = await supabase
    .from('habitos_diarios')
    .update(payload)
    .eq('id', Number(habitId))

  if (error) throw new Error(error.message)
}
