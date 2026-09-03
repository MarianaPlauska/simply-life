/** Sessão guiada de academia (shared) */

export type AcademyExercise = {
  id: string
  name: string
  sets: number
  reps: string
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
