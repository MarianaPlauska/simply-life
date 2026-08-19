// Detalhe estruturado da sessão — alimenta relatórios e analytics

import type { AcademyCompletedSet, AcademyExercise } from './academyWorkouts'

export interface AcademySessionSerieDetail
{
  serie: number
  peso_kg: number
  reps: number
  concluida_em?: string
}

export interface AcademySessionExerciseDetail
{
  id: string
  nome: string
  series: AcademySessionSerieDetail[]
}

export interface AcademySessionDetail
{
  treino_codigo: string
  treino_titulo: string
  exercicios: AcademySessionExerciseDetail[]
  volume_kg: number
  series_totais: number
  reps_totais: number
}

export interface FinalizarTreinoPayload
{
  completedSets: AcademyCompletedSet[]
  exercicios: AcademyExercise[]
  treinoTitulo: string
  treinoCodigo: string
}

export function computeSetVolume(pesoKg: number, reps: number): number
{
  if (!Number.isFinite(pesoKg) || !Number.isFinite(reps))
  {
    return 0
  }
  return Math.max(0, pesoKg) * Math.max(0, reps)
}

/** Σ (carga × reps) — volume de treino em kg·rep */
export function computeSessionVolume(
  sets: { peso_kg: number; reps: number }[],
): number
{
  const total = sets.reduce((acc, s) => acc + computeSetVolume(s.peso_kg, s.reps), 0)
  return Math.round(total * 100) / 100
}

export function buildAcademySessionDetail(input: FinalizarTreinoPayload): AcademySessionDetail
{
  const nomePorId = new Map(input.exercicios.map((e) => [e.id, e.nome]))
  const ordemIds = input.exercicios.map((e) => e.id)

  const porExercicio = new Map<string, AcademySessionSerieDetail[]>()

  for (const set of input.completedSets)
  {
    const lista = porExercicio.get(set.exercicio_id) ?? []
    lista.push({
      serie: set.serie,
      peso_kg: set.peso_kg,
      reps: set.reps,
      concluida_em: set.concluida_em,
    })
    porExercicio.set(set.exercicio_id, lista)
  }

  const exercicios: AcademySessionExerciseDetail[] = []
  const vistos = new Set<string>()

  for (const id of ordemIds)
  {
    const series = porExercicio.get(id)
    if (!series || series.length === 0)
    {
      continue
    }
    vistos.add(id)
    exercicios.push({
      id,
      nome: nomePorId.get(id) || id,
      series: series.sort((a, b) => a.serie - b.serie),
    })
  }

  for (const [id, series] of porExercicio)
  {
    if (vistos.has(id))
    {
      continue
    }
    exercicios.push({
      id,
      nome: nomePorId.get(id) || id,
      series: series.sort((a, b) => a.serie - b.serie),
    })
  }

  const flatSets = input.completedSets.map((s) => ({ peso_kg: s.peso_kg, reps: s.reps }))
  const repsTotais = flatSets.reduce((acc, s) => acc + s.reps, 0)

  return {
    treino_codigo: input.treinoCodigo,
    treino_titulo: input.treinoTitulo.trim() || 'Treino',
    exercicios,
    volume_kg: computeSessionVolume(flatSets),
    series_totais: flatSets.length,
    reps_totais: repsTotais,
  }
}

export function parseAcademySessionDetail(raw: unknown): AcademySessionDetail | null
{
  if (!raw || typeof raw !== 'object')
  {
    return null
  }
  const o = raw as Partial<AcademySessionDetail>
  if (!Array.isArray(o.exercicios))
  {
    return null
  }
  return {
    treino_codigo: String(o.treino_codigo ?? ''),
    treino_titulo: String(o.treino_titulo ?? 'Treino'),
    exercicios: o.exercicios as AcademySessionExerciseDetail[],
    volume_kg: Number(o.volume_kg ?? 0),
    series_totais: Number(o.series_totais ?? 0),
    reps_totais: Number(o.reps_totais ?? 0),
  }
}
