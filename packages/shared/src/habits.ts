/** Hábitos diários — água / proteína / treino (paridade web) */

export type HabitoTipo = 'agua' | 'proteina' | 'treino' | string

export type HabitoDiario = {
  id: string
  tipo: HabitoTipo
  nome: string
  metaDiaria: number
  progressoAtual: number
  unidade: string
}

export const AGUA_META_COPOS = 10
export const PROTEINA_META_G = 120

export function demoHabits(): HabitoDiario[]
{
  return [
    {
      id: 'h-agua',
      tipo: 'agua',
      nome: 'Água',
      metaDiaria: AGUA_META_COPOS,
      progressoAtual: 4,
      unidade: 'copos',
    },
    {
      id: 'h-proteina',
      tipo: 'proteina',
      nome: 'Proteína',
      metaDiaria: PROTEINA_META_G,
      progressoAtual: 45,
      unidade: 'g',
    },
    {
      id: 'h-treino',
      tipo: 'treino',
      nome: 'Treino',
      metaDiaria: 1,
      progressoAtual: 0,
      unidade: 'sessão',
    },
  ]
}

export function findHabit(habits: HabitoDiario[], tipo: HabitoTipo): HabitoDiario | undefined
{
  return habits.find((h) => h.tipo === tipo)
}

export function habitPct(h: HabitoDiario | undefined): number
{
  if (!h || h.metaDiaria <= 0) return 0
  return Math.min(100, Math.round((h.progressoAtual / h.metaDiaria) * 100))
}
