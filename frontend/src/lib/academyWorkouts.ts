// Modo Academia — exercícios, séries, descanso e histórico de carga

import type { LibraryExercise } from './academyExerciseLibrary'
import { localTodayIso } from './healthDayBoundary'

export interface AcademyExercise
{
  id: string
  nome: string
  series: number
  reps_alvo: string
  /** Carga sugerida em kg (pode evoluir com o histórico) */
  carga_kg?: number
  /** Exercícios com o mesmo id formam superset (sem descanso entre eles na mesma rodada) */
  superset_id?: string | null
}

export interface AcademyLoadEntry
{
  data: string
  peso_kg: number
  reps: number
}

export interface AcademyTreinoConfig
{
  descanso_segundos?: number
  exercicios_por_dia?: Record<string, AcademyExercise[]>
  /** Exercícios por data ISO — prioridade sobre o dia da semana */
  exercicios_por_data?: Record<string, AcademyExercise[]>
  historico_cargas?: Record<string, AcademyLoadEntry[]>
  exercicios_customizados?: LibraryExercise[]
  plano_por_data?: Record<string, { titulo: string; meta_minutos: number }>
  academy_modo_plano?: 'semana' | 'mes'
}

export interface AcademySetStep
{
  key: string
  exercicio_id: string
  exercicio_nome: string
  serie: number
  total_series: number
  reps_alvo: string
  carga_sugerida_kg?: number
  /** Sem descanso antes do próximo passo (superset) */
  pular_descanso_apos?: boolean
  superset_id?: string | null
}

export interface AcademyCompletedSet
{
  step_key: string
  exercicio_id: string
  serie: number
  peso_kg: number
  reps: number
  concluida_em: string
}

export const DEFAULT_DESCANSO_SEG = 90
export const MIN_DESCANSO_SEG = 15
export const MAX_DESCANSO_SEG = 300

const DIA_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

export type AcademyModoPlano = 'semana' | 'mes'

export type AcademyDiaRef =
  | { modo: 'semana'; key: string }
  | { modo: 'mes'; iso: string }

export interface AcademyPlanoDia
{
  titulo: string
  meta_minutos: number
}

export const DIAS_SEMANA = [
  { key: 'seg', label: 'Seg' },
  { key: 'ter', label: 'Ter' },
  { key: 'qua', label: 'Qua' },
  { key: 'qui', label: 'Qui' },
  { key: 'sex', label: 'Sex' },
  { key: 'sab', label: 'Sáb' },
  { key: 'dom', label: 'Dom' },
] as const

export type DiaTreinoKey = typeof DIA_KEYS[number]

export function hojeDiaTreinoKey(): string
{
  return DIA_KEYS[new Date().getDay()]
}

export function novoExercicioEmBranco(): AcademyExercise
{
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    nome: '',
    series: 3,
    reps_alvo: '10',
  }
}

export function mergeAcademyConfig(raw?: AcademyTreinoConfig | null): AcademyTreinoConfig
{
  return {
    descanso_segundos: raw?.descanso_segundos ?? DEFAULT_DESCANSO_SEG,
    exercicios_por_dia: raw?.exercicios_por_dia ?? {},
    exercicios_por_data: raw?.exercicios_por_data ?? {},
    plano_por_data: raw?.plano_por_data ?? {},
    historico_cargas: raw?.historico_cargas ?? {},
    exercicios_customizados: raw?.exercicios_customizados ?? [],
    academy_modo_plano: raw?.academy_modo_plano,
  }
}

export function resolvePlanoParaRef(
  raw: AcademyTreinoConfig | undefined,
  ref: AcademyDiaRef,
  planoSemana?: Record<string, AcademyPlanoDia>,
): AcademyPlanoDia | null
{
  if (ref.modo === 'mes')
  {
    const p = raw?.plano_por_data?.[ref.iso]
    if (p && (p.titulo.trim() || p.meta_minutos > 0))
    {
      return p
    }
    return null
  }

  const p = planoSemana?.[ref.key]
  if (p && (p.titulo.trim() || p.meta_minutos > 0))
  {
    return p
  }
  return null
}

export function resolveExerciciosParaRef(
  raw: AcademyTreinoConfig | undefined,
  ref: AcademyDiaRef,
): AcademyExercise[]
{
  const merged = mergeAcademyConfig(raw)
  if (ref.modo === 'mes')
  {
    return (merged.exercicios_por_data?.[ref.iso] ?? []).map((e) => ({ ...e }))
  }
  return (merged.exercicios_por_dia?.[ref.key] ?? []).map((e) => ({ ...e }))
}

export function resolvePlanoHoje(
  raw: AcademyTreinoConfig | undefined,
  planoSemana?: Record<string, AcademyPlanoDia>,
): AcademyPlanoDia | null
{
  const iso = localTodayIso()
  const porData = resolvePlanoParaRef(raw, { modo: 'mes', iso })
  if (porData)
  {
    return porData
  }
  return resolvePlanoParaRef(raw, { modo: 'semana', key: hojeDiaTreinoKey() }, planoSemana)
}

export function resolveExerciciosHoje(raw: AcademyTreinoConfig | undefined): AcademyExercise[]
{
  const iso = localTodayIso()
  const porData = resolveExerciciosParaRef(raw, { modo: 'mes', iso })
  if (porData.length > 0)
  {
    return porData
  }
  return resolveExerciciosParaRef(raw, { modo: 'semana', key: hojeDiaTreinoKey() })
}

export function exerciciosDoDia(
  config: AcademyTreinoConfig | undefined,
  diaKey: string,
): AcademyExercise[]
{
  return resolveExerciciosParaRef(config, { modo: 'semana', key: diaKey })
}

export function flattenExercisesToSteps(exercicios: AcademyExercise[]): AcademySetStep[]
{
  const steps: AcademySetStep[] = []
  let i = 0

  while (i < exercicios.length)
  {
    const atual = exercicios[i]
    const supersetId = atual.superset_id

    if (!supersetId)
    {
      for (let s = 1; s <= atual.series; s++)
      {
        steps.push(buildStep(atual, s))
      }
      i++
      continue
    }

    const grupo: AcademyExercise[] = [atual]
    i++
    while (i < exercicios.length && exercicios[i].superset_id === supersetId)
    {
      grupo.push(exercicios[i])
      i++
    }

    const maxSeries = Math.max(...grupo.map((e) => e.series))
    for (let s = 1; s <= maxSeries; s++)
    {
      for (let g = 0; g < grupo.length; g++)
      {
        const ex = grupo[g]
        if (s > ex.series)
        {
          continue
        }
        steps.push({
          ...buildStep(ex, s),
          superset_id: supersetId,
          pular_descanso_apos: g < grupo.length - 1,
        })
      }
    }
  }

  return steps
}

function buildStep(ex: AcademyExercise, serie: number): AcademySetStep
{
  return {
    key: `${ex.id}-s${serie}`,
    exercicio_id: ex.id,
    exercicio_nome: ex.nome,
    serie,
    total_series: ex.series,
    reps_alvo: ex.reps_alvo,
    carga_sugerida_kg: ex.carga_kg,
    superset_id: ex.superset_id ?? null,
  }
}

export interface AcademyChartPoint
{
  data: string
  peso_kg: number
  reps: number
  label: string
}

export function dadosGraficoCarga(
  historico: Record<string, AcademyLoadEntry[]> | undefined,
  exercicioId: string,
): AcademyChartPoint[]
{
  const lista = historico?.[exercicioId] ?? []
  return lista.map((e) =>
  {
    const d = new Date(e.data)
    const label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`
    return { data: e.data, peso_kg: e.peso_kg, reps: e.reps, label }
  })
}

export function toggleSupersetPar(
  exercicios: AcademyExercise[],
  indexA: number,
  indexB: number,
): AcademyExercise[]
{
  if (indexA < 0 || indexB < 0 || indexA >= exercicios.length || indexB >= exercicios.length)
  {
    return exercicios
  }
  const next = exercicios.map((e) => ({ ...e }))
  const a = next[indexA]
  const b = next[indexB]
  const mesmoGrupo = a.superset_id && a.superset_id === b.superset_id

  if (mesmoGrupo)
  {
    delete a.superset_id
    delete b.superset_id
    return next
  }

  const grupoId = `ss-${a.id}-${b.id}`
  a.superset_id = grupoId
  b.superset_id = grupoId
  return next
}

export function ultimaCarga(
  historico: Record<string, AcademyLoadEntry[]> | undefined,
  exercicioId: string,
): AcademyLoadEntry | null
{
  const lista = historico?.[exercicioId]
  if (!lista?.length)
  {
    return null
  }
  return lista[lista.length - 1]
}

export function melhorCarga(
  historico: Record<string, AcademyLoadEntry[]> | undefined,
  exercicioId: string,
): number | null
{
  const lista = historico?.[exercicioId]
  if (!lista?.length)
  {
    return null
  }
  return Math.max(...lista.map((e) => e.peso_kg))
}

export function appendHistoricoCarga(
  historico: Record<string, AcademyLoadEntry[]>,
  exercicioId: string,
  pesoKg: number,
  reps: number,
): Record<string, AcademyLoadEntry[]>
{
  const entry: AcademyLoadEntry = {
    data: new Date().toISOString(),
    peso_kg: pesoKg,
    reps,
  }
  const prev = historico[exercicioId] ?? []
  return {
    ...historico,
    [exercicioId]: [...prev, entry].slice(-40),
  }
}

export function formatProgressoCarga(
  anterior: number | null | undefined,
  atual: number,
): string | null
{
  if (anterior == null || anterior === atual)
  {
    return null
  }
  return `Antes ${anterior} kg → agora ${atual} kg`
}

export function formatRestMmSs(totalSec: number): string
{
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
