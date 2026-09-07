import { supabase } from '../supabase'
import type { HumorRegistro } from '@simply-life/shared'
import { localTodayIso, isoDaysAgo } from '@simply-life/shared'

function mapRow(row: Record<string, unknown>): HumorRegistro
{
  return {
    id: Number(row.id),
    data: String(row.data),
    humor: Number(row.humor),
    nota: (row.nota as string | null) ?? null,
    created_at: row.created_at ? String(row.created_at) : undefined,
  }
}

export async function fetchHumorMes(days = 90): Promise<HumorRegistro[]>
{
  const from = isoDaysAgo(days - 1)
  const { data, error } = await supabase
    .from('diario_humor')
    .select('*')
    .gte('data', from)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []).map((r) => mapRow(r as Record<string, unknown>))
}

export async function registrarHumor(input: {
  humor: number
  nota?: string
}): Promise<HumorRegistro>
{
  const { data: auth } = await supabase.auth.getUser()
  const uid = auth.user?.id
  if (!uid) throw new Error('Não autenticado')

  const dia = localTodayIso()
  const row = {
    user_id: uid,
    data: dia,
    humor: input.humor,
    emoji: null as string | null,
    nota: input.nota?.trim() || null,
  }

  const existing = await supabase
    .from('diario_humor')
    .select('id')
    .eq('user_id', uid)
    .eq('data', dia)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing.error) throw new Error(existing.error.message)

  if (existing.data)
  {
    const updated = await supabase
      .from('diario_humor')
      .update({ humor: input.humor, nota: row.nota })
      .eq('id', existing.data.id)
      .select()
      .single()
    if (updated.error) throw new Error(updated.error.message)
    return mapRow(updated.data as Record<string, unknown>)
  }

  const inserted = await supabase.from('diario_humor').insert(row).select().single()
  if (inserted.error) throw new Error(inserted.error.message)
  return mapRow(inserted.data as Record<string, unknown>)
}
