import type { HabitoDiario, HabitoDiarioConfig } from '../store/storeTypes'

// Data local do usuário (YYYY-MM-DD) — base para reset diário de saúde

const STORAGE_KEY = 'simply-life:health-day-iso'

export function localTodayIso(): string
{
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60 * 1000)
  return local.toISOString().slice(0, 10)
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

function configComData(config: HabitoDiarioConfig | undefined, today: string): HabitoDiarioConfig
{
  return { ...(config ?? {}), ultima_data: today }
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
      config: configComData(h.config, today),
    }
  })
}

export function isNovoDiaDeSaude(today: string): boolean
{
  return readStoredHealthDay() !== today
}
