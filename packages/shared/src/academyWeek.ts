import { DEFAULT_ACADEMY_SESSION, type AcademyExercise } from './academy'

export const ACADEMY_WEEK_DAYS = [
  { key: 'seg', label: 'Seg', full: 'Segunda' },
  { key: 'ter', label: 'Ter', full: 'Terça' },
  { key: 'qua', label: 'Qua', full: 'Quarta' },
  { key: 'qui', label: 'Qui', full: 'Quinta' },
  { key: 'sex', label: 'Sex', full: 'Sexta' },
  { key: 'sab', label: 'Sáb', full: 'Sábado' },
  { key: 'dom', label: 'Dom', full: 'Domingo' },
] as const

export type AcademyWeekKey = (typeof ACADEMY_WEEK_DAYS)[number]['key']
export type AcademyWeekPlan = Partial<Record<AcademyWeekKey, AcademyExercise[]>>

const WEEK_INDEX: AcademyWeekKey[] = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']

export function academyWeekKey(date = new Date()): AcademyWeekKey
{
  return WEEK_INDEX[date.getDay()]
}

export function newAcademyExercise(): AcademyExercise
{
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    sets: 3,
    reps: '10',
    restSec: 60,
  }
}

export function defaultAcademyWeekPlan(): AcademyWeekPlan
{
  const plan: AcademyWeekPlan = {}
  for (const key of ['seg', 'qua', 'sex'] as const)
  {
    plan[key] = DEFAULT_ACADEMY_SESSION.map((ex) => ({ ...ex, id: `${ex.id}-${key}` }))
  }
  return plan
}

function asRecord(value: unknown): Record<string, unknown> | null
{
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

export function parseAcademyExercise(raw: unknown): AcademyExercise | null
{
  const row = asRecord(raw)
  if (!row) return null
  const name = String(row.nome ?? row.name ?? '').trim()
  const id = String(row.id ?? '').trim() || `ex-${Math.random().toString(36).slice(2, 8)}`
  const sets = Math.max(1, Number(row.series ?? row.sets) || 3)
  const reps = String(row.reps_alvo ?? row.reps ?? '10')
  const restSec = Math.max(0, Number(row.rest_segundos ?? row.restSec) || 60)
  const known = new Set(['id', 'nome', 'name', 'series', 'sets', 'reps_alvo', 'reps', 'rest_segundos', 'restSec'])
  const extra: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row))
  {
    if (!known.has(key)) extra[key] = value
  }
  return {
    id,
    name,
    sets,
    reps,
    restSec,
    extra: Object.keys(extra).length ? extra : undefined,
  }
}

export function serializeAcademyExercise(ex: AcademyExercise): Record<string, unknown>
{
  return {
    ...(ex.extra ?? {}),
    id: ex.id,
    nome: ex.name,
    series: ex.sets,
    reps_alvo: ex.reps,
    rest_segundos: ex.restSec,
  }
}

export function weekPlanFromConfig(config?: Record<string, unknown> | null): AcademyWeekPlan
{
  const raw = asRecord(config?.exercicios_por_dia)
  if (!raw)
  {
    return defaultAcademyWeekPlan()
  }
  const plan: AcademyWeekPlan = {}
  for (const day of ACADEMY_WEEK_DAYS)
  {
    const list = raw[day.key]
    if (!Array.isArray(list)) continue
    plan[day.key] = list.map(parseAcademyExercise).filter((e): e is AcademyExercise => Boolean(e))
  }
  return plan
}

export function configWithWeekPlan(
  config: Record<string, unknown> | undefined,
  plan: AcademyWeekPlan,
): Record<string, unknown>
{
  const exercicios_por_dia: Record<string, Record<string, unknown>[]> = {}
  const plano_semana: Record<string, { titulo: string; meta_minutos: number }> = {}
  for (const day of ACADEMY_WEEK_DAYS)
  {
    const list = (plan[day.key] ?? []).filter((ex) => ex.name.trim().length > 0)
    exercicios_por_dia[day.key] = list.map(serializeAcademyExercise)
    plano_semana[day.key] = {
      titulo: list.length ? `${list.length} exercício${list.length === 1 ? '' : 's'}` : 'Folga',
      meta_minutos: list.length * 12,
    }
  }
  return {
    ...(config ?? {}),
    exercicios_por_dia,
    plano_semana,
    academy_modo_plano: 'semana',
  }
}

export function resolveAcademyDay(
  plan: AcademyWeekPlan,
  key: AcademyWeekKey = academyWeekKey(),
): AcademyExercise[]
{
  return (plan[key] ?? []).filter((e) => e.name.trim().length > 0)
}

export function academyDayLabel(key: AcademyWeekKey = academyWeekKey()): string
{
  return ACADEMY_WEEK_DAYS.find((d) => d.key === key)?.full ?? key
}
