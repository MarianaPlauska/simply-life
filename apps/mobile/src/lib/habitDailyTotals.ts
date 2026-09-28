/**
 * API única de totais diários de hábitos (para metas juntos e gráficos).
 *
 *   habitDailyTotals(tipo: HabitTipo, fromIso: string, toIso: string): Promise<HabitDayValue[]>
 *
 * - `tipo`: 'agua' (copos) | 'proteina' (gramas) | 'sono' (horas, passo de 0,5) | 'treino' (1 feito, 0 não).
 * - `fromIso` e `toIso`: datas locais YYYY-MM-DD, inclusivas.
 * - Retorna um item por dia do intervalo, em ordem, `{ data: 'YYYY-MM-DD', valor: number }`,
 *   com `valor: 0` nos dias sem registro.
 * - Conta logada: histórico do Supabase (`historico_habitos`) com o log local por cima
 *   (o registro deste aparelho vale quando existir). Convidado ou sem Supabase: só o log local.
 * - Nunca lança: se o servidor falhar, usa o que houver no aparelho.
 *
 * Escrita: `saveHabitDay(tipo, valor, { habitoId?, remote, iso? })`, chamada pelo dataStore em
 * addWaterCup, removeWaterCup, addProteinGrams, setSleepHours e toggleTreinoDone.
 */
import { addDaysIso, localTodayIso } from '@simply-life/shared'
import { useAuthStore } from '../store/authStore'
import { supabaseConfigured } from './supabase'
import { localHabitHistory, recordHabitDay } from './habitDayLog'
import { isLocalHabitId } from './sync/habitDayBoundary'
import { fetchHabitHistory, upsertHabitHistoricoValor, type HabitDayValue } from './sync/habitHistorico'

export type { HabitDayValue } from './sync/habitHistorico'

export type HabitTipo = 'agua' | 'proteina' | 'sono' | 'treino'

/** Escopo do log local: id da conta, ou 'guest'. */
export function habitLogScope(): string
{
  const { userId, isGuest } = useAuthStore.getState()
  return isGuest || !userId ? 'guest' : userId
}

function isRemote(): boolean
{
  const { userId, isGuest } = useAuthStore.getState()
  return supabaseConfigured && !isGuest && Boolean(userId)
}

/**
 * Grava o total do dia: sempre no log local; também no Supabase quando `remote` e o hábito
 * já tem id do banco. Falha no servidor não interrompe (o log local fica com o valor).
 */
export async function saveHabitDay(
  tipo: HabitTipo,
  valor: number,
  opts: { habitoId?: string; remote: boolean; iso?: string },
): Promise<void>
{
  const iso = opts.iso ?? localTodayIso()
  await recordHabitDay(habitLogScope(), tipo, iso, valor).catch(() => undefined)
  if (!opts.remote || !opts.habitoId || isLocalHabitId(opts.habitoId)) return
  await upsertHabitHistoricoValor(opts.habitoId, valor, iso).catch(() => undefined)
}

export async function habitDailyTotals(
  tipo: HabitTipo,
  fromIso: string,
  toIso: string,
): Promise<HabitDayValue[]>
{
  const from = fromIso.slice(0, 10)
  const to = toIso.slice(0, 10)
  if (from > to) return []

  const byDay = new Map<string, number>()
  if (isRemote())
  {
    const remote = await fetchHabitHistory(tipo, from, to).catch(() => [] as HabitDayValue[])
    for (const r of remote) byDay.set(r.data, r.valor)
  }
  const local = await localHabitHistory(habitLogScope(), tipo, from, to).catch(() => [] as HabitDayValue[])
  for (const r of local) byDay.set(r.data, r.valor)

  const out: HabitDayValue[] = []
  // limite de segurança: ~3 anos
  for (let d = from, i = 0; d <= to && i < 1100; d = addDaysIso(d, 1), i++)
  {
    out.push({ data: d, valor: byDay.get(d) ?? 0 })
  }
  return out
}
