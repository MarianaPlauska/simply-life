import { supabase } from '../supabase'
import type { Medicamento } from '@simply-life/shared'

function mapMed(row: Record<string, unknown>): Medicamento
{
  return {
    id: Number(row.id),
    nome: String(row.nome || 'Medicamento'),
    horario: String(row.horario || '08:00'),
    tomado: Boolean(row.tomado_hoje),
  }
}

export async function fetchMedicamentos(): Promise<Medicamento[]>
{
  const { data, error } = await supabase
    .from('medicamentos')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((r) => mapMed(r as Record<string, unknown>))
}

export async function toggleMedicamentoTomado(id: number, tomado: boolean): Promise<void>
{
  const { error } = await supabase
    .from('medicamentos')
    .update({ tomado_hoje: tomado ? 1 : 0 })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function insertMedicamento(nome: string, horario: string): Promise<Medicamento>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')
  const { data, error } = await supabase
    .from('medicamentos')
    .insert({ user_id: uid, nome: nome.trim(), horario: horario.trim(), tomado_hoje: 0 })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return mapMed(data as Record<string, unknown>)
}

export async function deleteMedicamento(id: number): Promise<void>
{
  const { error } = await supabase.from('medicamentos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function fetchMedsTakenLastDays(days = 7): Promise<string[]>
{
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('medicamento_tomadas')
    .select('medicamento_id, tomado_em')
    .gte('tomado_em', start.toISOString())

  if (error) throw new Error(error.message)
  return (data || []).map((row) =>
  {
    const id = String((row as { medicamento_id?: number }).medicamento_id ?? '')
    const iso = String((row as { tomado_em?: string }).tomado_em ?? '').slice(0, 10)
    return `${id}|${iso}`
  })
}
