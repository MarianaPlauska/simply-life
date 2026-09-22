import type { HabitoDiario } from '@simply-life/shared'

type HabitoConfig = Record<string, unknown> & {
  ultima_data?: string
  registros_ml?: number[]
  proteina_por_refeicao?: Record<string, unknown>
}

export function isLocalHabitId(id: string): boolean
{
  return id.startsWith('h-')
}

export function configAposResetDiario(
  config: HabitoConfig | undefined,
  today: string,
  tipo?: string,
): HabitoConfig
{
  const next: HabitoConfig = { ...(config ?? {}), ultima_data: today }

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

export function habitoPrecisaReset(h: HabitoDiario, today: string): boolean
{
  return h.config?.ultima_data !== today
}

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
      progressoAtual: 0,
      config: configAposResetDiario(h.config as HabitoConfig, today, h.tipo),
    }
  })
}

/** Preserva progresso otimista do dia ao buscar do Supabase. */
export function mergeHabitosAfterFetch(
  local: HabitoDiario[],
  remote: HabitoDiario[],
  today: string,
): HabitoDiario[]
{
  const resetRemote = resetHabitosParaHoje(remote, today)
  const localOnly = local.filter(
    (h) => isLocalHabitId(h.id) && !resetRemote.some((r) => r.tipo === h.tipo),
  )

  const merged = resetRemote.map((remoteH) =>
  {
    const localH = local.find((l) => l.id === remoteH.id || l.tipo === remoteH.tipo)
    if (!localH)
    {
      return remoteH
    }

    const localToday = localH.config?.ultima_data === today
    const remoteToday = remoteH.config?.ultima_data === today
    const localMl = Array.isArray(localH.config?.registros_ml)
      ? localH.config.registros_ml.length
      : 0
    const remoteMl = Array.isArray(remoteH.config?.registros_ml)
      ? remoteH.config.registros_ml.length
      : 0

    if (
      localToday
      && (
        !remoteToday
        || localH.progressoAtual > remoteH.progressoAtual
        || localMl > remoteMl
      )
    )
    {
      return { ...localH, id: remoteH.id }
    }

    return remoteH
  })

  return [...merged, ...localOnly]
}

export function aguaRegistrosHoje(h: HabitoDiario | undefined, today: string, ml: number): number[]
{
  if (!h) return []
  const cfg = h.config ?? {}
  if (cfg.ultima_data === today && Array.isArray(cfg.registros_ml))
  {
    return [...cfg.registros_ml]
  }
  if (cfg.ultima_data === today && h.progressoAtual > 0)
  {
    return Array.from({ length: h.progressoAtual }, () => ml)
  }
  return []
}
