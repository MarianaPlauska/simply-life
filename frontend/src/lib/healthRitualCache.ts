// Cache local do ritual diário — evita flash “vazio” antes do Supabase responder

import { countDoseProgress } from './medicamentosSchedule'
import { localTodayIso, readCachedWaterEntries } from './healthDayBoundary'
import { readScopedJson, scopedStorageKey, writeScopedJson } from './userScopedStorage'
import type { HabitoDiario, Medicamento, MedicamentoTomada } from '../store/storeTypes'

const CACHE_KEY = 'simply-life:health-ritual-snapshot'

export interface HealthRitualInputs
{
  humorHojeCount: number
  aguaCopos: number
  aguaMeta: number
  medicamentosTotal: number
  medicamentosTomados: number
}

interface HealthRitualCacheBlob extends HealthRitualInputs
{
  date: string
  savedAt: string
}

export function ritualCacheStorageKey(): string
{
  return scopedStorageKey(CACHE_KEY)
}

function readBlob(): HealthRitualCacheBlob | null
{
  return readScopedJson<HealthRitualCacheBlob>(CACHE_KEY)
}

/** Lê cache só se for do dia local atual */
export function readHealthRitualCacheToday(): HealthRitualInputs | null
{
  const blob = readBlob()
  if (!blob || blob.date !== localTodayIso())
  {
    return null
  }
  return {
    humorHojeCount: blob.humorHojeCount,
    aguaCopos: blob.aguaCopos,
    aguaMeta: blob.aguaMeta,
    medicamentosTotal: blob.medicamentosTotal,
    medicamentosTomados: blob.medicamentosTomados,
  }
}

/** Mescla live + cache — nunca regride o que o usuário já viu hoje */
export function mergeHealthRitualInputs(
  live: HealthRitualInputs,
  cached: HealthRitualInputs | null,
): HealthRitualInputs
{
  if (!cached)
  {
    return live
  }

  return {
    humorHojeCount: Math.max(live.humorHojeCount, cached.humorHojeCount),
    aguaCopos: Math.max(live.aguaCopos, cached.aguaCopos),
    aguaMeta: live.aguaMeta > 0 ? live.aguaMeta : cached.aguaMeta,
    medicamentosTotal: Math.max(live.medicamentosTotal, cached.medicamentosTotal),
    medicamentosTomados: Math.max(live.medicamentosTomados, cached.medicamentosTomados),
  }
}

export function persistHealthRitualCache(inputs: HealthRitualInputs): void
{
  const cached = readHealthRitualCacheToday()
  const merged = cached ? mergeHealthRitualInputs(inputs, cached) : inputs

  writeScopedJson(CACHE_KEY, {
    ...merged,
    date: localTodayIso(),
    savedAt: new Date().toISOString(),
  })
}

/** Monta inputs a partir do store + caches de água */
export function buildHealthRitualInputsFromStore(opts: {
  humorHojeCount: number
  habitos: HabitoDiario[]
  medicamentos: Medicamento[]
  medicamentoTomadas: MedicamentoTomada[]
}): HealthRitualInputs
{
  const agua = opts.habitos.find((h) => h.tipo === 'agua')
  const cachedWater = readCachedWaterEntries()
  const aguaCopos = Math.max(
    agua?.progresso_atual ?? 0,
    cachedWater?.length ?? 0,
  )
  const dose = countDoseProgress(opts.medicamentos, opts.medicamentoTomadas)

  return {
    humorHojeCount: opts.humorHojeCount,
    aguaCopos,
    aguaMeta: agua?.meta_diaria ?? 8,
    medicamentosTotal: dose.total || opts.medicamentos.length,
    medicamentosTomados: dose.tomados,
  }
}
