/**
 * Log local do valor diário por tipo de hábito (agua, proteina, sono, treino), separado
 * por conta (id do usuário ou convidado). Persistido com `persistStorage` (arquivo no
 * nativo, localStorage no web). Serve para convidado e como cópia local da conta logada.
 */
import { persistStorage, whenPersistReady } from './persistStorage'
import type { HabitDayValue } from './sync/habitHistorico'

const KEY = 'simply-life-habit-day-log-v1'

type Log = Record<string, Record<string, Record<string, number>>>

function readLog(): Log
{
  try
  {
    const raw = persistStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown) : null
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Log) : {}
  }
  catch
  {
    return {}
  }
}

/** Grava o total do dia (substitui o valor anterior do mesmo dia). */
export async function recordHabitDay(scope: string, tipo: string, iso: string, valor: number): Promise<void>
{
  await whenPersistReady()
  const log = readLog()
  const byTipo = log[scope] ?? {}
  const days = byTipo[tipo] ?? {}
  days[iso.slice(0, 10)] = Math.max(0, Number.isFinite(valor) ? valor : 0)
  byTipo[tipo] = days
  log[scope] = byTipo
  persistStorage.setItem(KEY, JSON.stringify(log))
}

/** Valores locais no intervalo [fromIso, toIso], só dias registrados, ordenados. */
export async function localHabitHistory(
  scope: string,
  tipo: string,
  fromIso: string,
  toIso: string,
): Promise<HabitDayValue[]>
{
  await whenPersistReady()
  const days = readLog()[scope]?.[tipo] ?? {}
  return Object.keys(days)
    .filter((d) => d >= fromIso && d <= toIso)
    .sort()
    .map((data) => ({ data, valor: days[data] ?? 0 }))
}
