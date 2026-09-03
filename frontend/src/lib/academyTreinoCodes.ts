// Códigos estáveis de treino - Treino A, B, 01…

import type { AcademyPlanoDia } from './academyWorkouts'
import { DIAS_SEMANA, hojeDiaTreinoKey } from './academyWorkouts'
import { localTodayIso } from './healthDayBoundary'

const CODIGOS_SEMANA = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const

/** Código padrão a partir do dia da semana (seg=A, ter=B, …) */
export function codigoFromDiaSemana(diaKey: string): string
{
  const idx = DIAS_SEMANA.findIndex((d) => d.key === diaKey)
  if (idx >= 0 && idx < CODIGOS_SEMANA.length)
  {
    return CODIGOS_SEMANA[idx]
  }
  return diaKey.slice(0, 2).toUpperCase()
}

/** Código numérico do dia do mês (01-31) para planos por data */
export function codigoFromIso(iso: string): string
{
  const day = iso.slice(8, 10)
  return day || '01'
}

export function resolveTreinoCodigo(opts: {
  plano?: AcademyPlanoDia | null
  diaKey?: string
  iso?: string
  titulo?: string
}): string
{
  const custom = opts.plano?.codigo?.trim()
  if (custom)
  {
    return custom.toUpperCase()
  }

  if (opts.iso)
  {
    return codigoFromIso(opts.iso)
  }

  const dia = opts.diaKey ?? hojeDiaTreinoKey()
  return codigoFromDiaSemana(dia)
}

/** Garante código único ao criar slot novo no plano semanal */
export function sugerirCodigoPlano(
  planoSemana: Record<string, AcademyPlanoDia> | undefined,
  diaKey: string,
): string
{
  const existentes = new Set(
    Object.values(planoSemana ?? {})
      .map((p) => p.codigo?.trim().toUpperCase())
      .filter(Boolean),
  )
  const base = codigoFromDiaSemana(diaKey)
  if (!existentes.has(base))
  {
    return base
  }
  for (const letter of CODIGOS_SEMANA)
  {
    if (!existentes.has(letter))
    {
      return letter
    }
  }
  return codigoFromIso(localTodayIso())
}

/** Rótulo exibido: Treino A - Peito/Tríceps */
export function formatTreinoLabel(codigo: string, titulo?: string): string
{
  const code = codigo.trim().toUpperCase()
  const name = titulo?.trim()
  if (code && name)
  {
    return `Treino ${code} - ${name}`
  }
  if (code)
  {
    return `Treino ${code}`
  }
  return name || 'Treino'
}

export function labelTreinoPlano(
  plano: AcademyPlanoDia | null | undefined,
  ref: { diaKey?: string; iso?: string },
): string
{
  const codigo = resolveTreinoCodigo({ plano, ...ref })
  return formatTreinoLabel(codigo, plano?.titulo)
}

/** Garante código persistente ao salvar slot do plano */
export function ensurePlanoCodigo(
  patch: Partial<AcademyPlanoDia>,
  atual: AcademyPlanoDia | null,
  ref: { diaKey?: string; iso?: string },
  planoSemana?: Record<string, AcademyPlanoDia>,
): AcademyPlanoDia
{
  const titulo = patch.titulo ?? atual?.titulo ?? ''
  const metaMinutos = patch.meta_minutos ?? atual?.meta_minutos ?? 0

  let codigo = (patch.codigo ?? atual?.codigo)?.trim().toUpperCase()
  if (!codigo)
  {
    if (ref.iso)
    {
      codigo = codigoFromIso(ref.iso)
    }
    else if (ref.diaKey)
    {
      codigo = sugerirCodigoPlano(planoSemana, ref.diaKey)
    }
    else
    {
      codigo = 'A'
    }
  }

  return { titulo, meta_minutos: metaMinutos, codigo }
}
