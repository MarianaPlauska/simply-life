import type { HabitoDiario, HabitoDiarioConfig } from '../store/storeTypes'
import { readScopedJson, scopedStorageKey, writeScopedJson } from './userScopedStorage'

const WATER_DAY_CACHE_KEY = 'simply-life:water-entries-day'

interface WaterDayCache
{
  date: string
  entries: number[]
}

export function readCachedWaterEntries(): number[] | null
{
  const cached = readScopedJson<WaterDayCache>(WATER_DAY_CACHE_KEY)
  if (!cached || cached.date !== localTodayIso()) return null
  return cached.entries
}

export function writeCachedWaterEntries(entries: number[]): void
{
  writeScopedJson(WATER_DAY_CACHE_KEY, {
    date: localTodayIso(),
    entries,
  })
}

// Data local do usuário (YYYY-MM-DD) - base para reset diário de saúde

const STORAGE_KEY = 'simply-life:health-day-iso'

export function localTodayIso(): string
{
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function readStoredHealthDay(): string | null
{
  return readScopedJson<string>(STORAGE_KEY)
}

export function writeStoredHealthDay(iso: string): void
{
  writeScopedJson(STORAGE_KEY, iso)
}

/** IDs locais (Date.now) ainda não sincronizados com o Supabase */
export function isPhantomHabitId(id: number): boolean
{
  return id > 1_000_000_000_000
}

/** Evita que fetch remoto apague progresso otimista do dia atual */
export function mergeHabitosAfterFetch(
  local: HabitoDiario[],
  remote: HabitoDiario[],
  today: string,
): HabitoDiario[]
{
  const resetRemote = resetHabitosParaHoje(remote, today)
  const localOnly = local.filter(
    (h) => isPhantomHabitId(h.id) && !resetRemote.some((r) => r.tipo === h.tipo),
  )

  const merged = resetRemote.map((remoteH) =>
  {
    const localH = local.find((l) => l.id === remoteH.id || l.tipo === remoteH.tipo)
    if (!localH)
    {
      if (remoteH.tipo === 'agua')
      {
        const cached = readCachedWaterEntries()
        if (cached && cached.length > 0 && remoteH.config?.ultima_data !== today)
        {
          return {
            ...remoteH,
            progresso_atual: cached.length,
            config: {
              ...(remoteH.config ?? {}),
              ultima_data: today,
              registros_ml: cached,
            },
          }
        }
      }
      return remoteH
    }

    const localToday = localH.config?.ultima_data === today
    const remoteToday = remoteH.config?.ultima_data === today
    const localMl = localH.config?.registros_ml?.length ?? 0
    const remoteMl = remoteH.config?.registros_ml?.length ?? 0
    const cachedMl = localH.tipo === 'agua' ? (readCachedWaterEntries()?.length ?? 0) : 0

    if (
      localToday
      && (
        !remoteToday
        || localH.progresso_atual > remoteH.progresso_atual
        || localMl > remoteMl
        || cachedMl > remoteMl
        || (localH.config?.ml_por_copo && localH.config.ml_por_copo !== remoteH.config?.ml_por_copo)
        || (localH.config?.ml_presets?.length && JSON.stringify(localH.config.ml_presets) !== JSON.stringify(remoteH.config?.ml_presets))
        || (localH.config?.ml_ocultos?.length && JSON.stringify(localH.config.ml_ocultos) !== JSON.stringify(remoteH.config?.ml_ocultos))
      )
    )
    {
      return { ...localH, id: remoteH.id }
    }

    return remoteH
  })

  return [...merged, ...localOnly]
}

/** Config após virada do dia - zera registros de água mas mantém ml_por_copo e demais prefs */
export function configAposResetDiario(
  config: HabitoDiarioConfig | undefined,
  today: string,
  tipo?: string,
): HabitoDiarioConfig
{
  const next: HabitoDiarioConfig = { ...(config ?? {}), ultima_data: today }

  if (tipo === 'agua' || (config?.registros_ml && config.registros_ml.length > 0))
  {
    next.registros_ml = []
  }

  if (tipo === 'proteina')
  {
    next.proteina_por_refeicao = {}
  }

  return next
}

/** Hábito precisa zerar se a última data salva não é hoje */
export function habitoPrecisaReset(h: HabitoDiario, today: string): boolean
{
  return h.config?.ultima_data !== today
}

/** Aplica reset local nos hábitos cujo progresso é do dia anterior */
export function resetHabitosParaHoje(habitos: HabitoDiario[], today: string): HabitoDiario[]
{
  return habitos.map((h) =>
  {
    if (!habitoPrecisaReset(h, today))
    {
      return h
    }
    return {
      ...h,
      progresso_atual: 0,
      config: configAposResetDiario(h.config, today, h.tipo),
    }
  })
}

export function isNovoDiaDeSaude(today: string): boolean
{
  const stored = readStoredHealthDay()
  if (stored === today)
  {
    return false
  }
  // Migra chave legada global para escopo por usuário
  try
  {
    const legacy = localStorage.getItem(STORAGE_KEY)
    if (legacy === today)
    {
      writeStoredHealthDay(today)
      return false
    }
  }
  catch { /* quota */ }
  return stored !== today
}

export function waterPrefsStorageKey(): string
{
  return scopedStorageKey('simply-life:water-prefs')
}
