import type { HabitoDiario, HabitoDiarioConfig } from '../store/storeTypes'

// Data local do usuário (YYYY-MM-DD) — base para reset diário de saúde

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
  try
  {
    return localStorage.getItem(STORAGE_KEY)
  }
  catch
  {
    return null
  }
}

export function writeStoredHealthDay(iso: string): void
{
  try
  {
    localStorage.setItem(STORAGE_KEY, iso)
  }
  catch { /* quota */ }
}

/** Config após virada do dia — zera registros de água mas mantém ml_por_copo e demais prefs */
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
  return readStoredHealthDay() !== today
}
