/** Trilhas TCC opt-in — conteúdo institucional, não substitui terapia. */

export type TccJourneyId = 'thought_record' | 'behavioral_activation' | 'gradual_exposure'

export type TccJourney = {
  id: TccJourneyId
  title: string
  subtitle: string
  durationMin: number
  steps: number
  route: string
}

export const TCC_JOURNEYS: TccJourney[] = [
  {
    id: 'thought_record',
    title: 'Registro de pensamento',
    subtitle: 'Situação, pensamento automático, evidências e alternativa mais equilibrada.',
    durationMin: 8,
    steps: 5,
    route: '/tcc/thought-record',
  },
  {
    id: 'behavioral_activation',
    title: 'Ativação comportamental',
    subtitle: 'Escolha uma micro-ação de 5–15 min e coloque no seu dia como tarefa.',
    durationMin: 5,
    steps: 3,
    route: '/tcc/behavioral-activation',
  },
  {
    id: 'gradual_exposure',
    title: 'Exposição gradual',
    subtitle: 'Monte uma hierarquia do que você evita e escolha o menor passo para hoje.',
    durationMin: 10,
    steps: 4,
    route: '/tcc/gradual-exposure',
  },
]

export function tccJourneyById(id: TccJourneyId): TccJourney | undefined
{
  return TCC_JOURNEYS.find((j) => j.id === id)
}

export function tccJourneyRoute(id: TccJourneyId): string
{
  return tccJourneyById(id)?.route ?? '/(tabs)/saude?section=apoio'
}
