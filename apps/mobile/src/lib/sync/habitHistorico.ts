import { supabase } from '../supabase'

export type HabitHistoricoRow = {
  data: string
  concluido: number
}

/** Total de um dia para um tipo de hábito (agua em copos, proteina em g, sono em h, treino 1/0). */
export type HabitDayValue = {
  data: string
  valor: number
}

/** Coluna `valor` ainda não existe (migração 063 não rodou): cai para `concluido`. */
function missingValorColumn(message: string | undefined): boolean
{
  return Boolean(message && /valor/i.test(message) && /column|coluna|schema/i.test(message))
}

/** Grava o valor do dia (upsert por hábito e data). `concluido` recebe o valor arredondado. */
export async function upsertHabitHistoricoValor(
  habitoId: string | number,
  valor: number,
  data: string,
): Promise<void>
{
  const uid = (await supabase.auth.getUser()).data.user?.id
  if (!uid) return

  const safe = Math.max(0, Number.isFinite(valor) ? valor : 0)
  const base = {
    user_id: uid,
    habito_id: Number(habitoId),
    data,
    concluido: Math.round(safe),
  }

  const { error } = await supabase
    .from('historico_habitos')
    .upsert({ ...base, valor: safe }, { onConflict: 'habito_id,data' })

  if (!error) return
  if (!missingValorColumn(error.message)) throw new Error(error.message)

  const retry = await supabase.from('historico_habitos').upsert(base, { onConflict: 'habito_id,data' })
  if (retry.error) throw new Error(retry.error.message)
}

export async function upsertHabitHistoricoCups(
  habitoId: string | number,
  cups: number,
  data: string,
): Promise<void>
{
  await upsertHabitHistoricoValor(habitoId, cups, data)
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

type RawHistoryRow = { data: string; concluido?: number | null; valor?: number | string | null }

/**
 * Valor por dia de um tipo de hábito (`habitos_diarios.tipo`) no intervalo [fromIso, toIso]
 * (datas YYYY-MM-DD, inclusivas), só do usuário logado (RLS). Soma se houver mais de um
 * hábito do mesmo tipo. Ordenado por data; dias sem registro não aparecem.
 */
export async function fetchHabitHistory(
  tipo: string,
  fromIso: string,
  toIso: string,
): Promise<HabitDayValue[]>
{
  const query = (cols: string) =>
    supabase
      .from('historico_habitos')
      .select(`${cols}, habitos_diarios!inner(tipo)`)
      .eq('habitos_diarios.tipo', tipo)
      .gte('data', fromIso)
      .lte('data', toIso)

  let res = await query('data, concluido, valor')
  if (res.error && missingValorColumn(res.error.message)) res = await query('data, concluido')
  if (res.error) throw new Error(res.error.message)

  const byDay = new Map<string, number>()
  for (const row of (res.data ?? []) as unknown as RawHistoryRow[])
  {
    const raw = row.valor ?? row.concluido ?? 0
    const n = typeof raw === 'string' ? parseFloat(raw) : raw
    if (!Number.isFinite(n)) continue
    const day = String(row.data).slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + n)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, valor]) => ({ data, valor }))
}
