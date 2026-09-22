/** Exercícios de acalmar — opt-in, sem gamificação, não substituem emergência. */

export type CalmExerciseId = 'box_breathing' | 'grounding_54321'

export type CalmExercise = {
  id: CalmExerciseId
  title: string
  subtitle: string
  durationMin: number
  route: string
}

export const CALM_EXERCISES: CalmExercise[] = [
  {
    id: 'box_breathing',
    title: 'Respirar em 4 tempos',
    subtitle: 'Inspire 4s, segure 4s, expire 4s, segure 4s. Ajuda quando o peito aperta.',
    durationMin: 2,
    route: '/calm/box-breathing',
  },
  {
    id: 'grounding_54321',
    title: 'Voltar aos cinco sentidos',
    subtitle: '5 coisas que vê, 4 que sente, 3 sons, 2 cheiros, 1 sabor. Traz o corpo de volta.',
    durationMin: 2,
    route: '/calm/grounding',
  },
]

export function calmExerciseById(id: CalmExerciseId): CalmExercise | undefined
{
  return CALM_EXERCISES.find((e) => e.id === id)
}
