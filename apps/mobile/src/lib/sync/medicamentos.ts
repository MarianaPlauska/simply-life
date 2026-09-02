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
