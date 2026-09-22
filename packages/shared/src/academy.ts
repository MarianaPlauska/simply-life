/** Sessão guiada de academia (shared) */

export type AcademyExercise = {
  id: string
  name: string
  sets: number
  reps: string
  restSec: number
  /** Campos extras da web (carga, superset) para não perder no save. */
  extra?: Record<string, unknown>
}

export type AcademySetStep = {
  key: string
  exerciseId: string
  name: string
  setIndex: number
  setTotal: number
  reps: string
  /** Segundos da isometria (prancha). Null quando a série é por repetição. */
  workSec: number | null
  /** Descanso após esta série; 0 na última série do treino. */
  restSec: number
}

export const DEFAULT_ACADEMY_SESSION: AcademyExercise[] = [
  { id: 'squat', name: 'Agachamento', sets: 3, reps: '10-12', restSec: 60 },
  { id: 'push', name: 'Flexão ou supino', sets: 3, reps: '8-12', restSec: 75 },
  { id: 'row', name: 'Remada', sets: 3, reps: '10-12', restSec: 60 },
  { id: 'plank', name: 'Prancha', sets: 3, reps: '30-45s', restSec: 45 },
]

export function academySessionProgress(
  completedIds: string[],
  plan: AcademyExercise[] = DEFAULT_ACADEMY_SESSION,
): { done: number; total: number; pct: number }
{
  const total = plan.length
  const done = plan.filter((e) => completedIds.includes(e.id)).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

/** Extrai o teto em segundos de "30-45s" ou "40s". */
export function parseTimedHoldSec(reps: string): number | null
{
  const range = reps.match(/(\d+)\s*-\s*(\d+)\s*s/i)
  if (range) return Number(range[2])
  const single = reps.match(/(\d+)\s*s/i)
  if (single) return Number(single[1])
  return null
}

export function flattenAcademySets(
  plan: AcademyExercise[] = DEFAULT_ACADEMY_SESSION,
): AcademySetStep[]
{
  const lastEx = plan.length - 1
  const steps: AcademySetStep[] = []
  plan.forEach((ex, ei) =>
  {
    for (let s = 1; s <= ex.sets; s++)
    {
      const lastOfPlan = ei === lastEx && s === ex.sets
      steps.push({
        key: `${ex.id}-${s}`,
        exerciseId: ex.id,
        name: ex.name,
        setIndex: s,
        setTotal: ex.sets,
        reps: ex.reps,
        workSec: parseTimedHoldSec(ex.reps),
        restSec: lastOfPlan ? 0 : ex.restSec,
      })
    }
  })
  return steps
}

export function formatRestClock(sec: number): string
{
  const n = Math.max(0, Math.floor(sec))
  const m = Math.floor(n / 60)
  const s = n % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
