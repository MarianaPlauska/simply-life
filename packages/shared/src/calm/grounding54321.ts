export type GroundingStep = {
  count: number
  sense: string
  prompt: string
  hint: string
}

export const GROUNDING_STEPS: GroundingStep[] = [
  {
    count: 5,
    sense: 'visão',
    prompt: '5 coisas que você vê',
    hint: 'Olhe em volta, sem pressa. Nomeie cinco objetos ao redor.',
  },
  {
    count: 4,
    sense: 'toque',
    prompt: '4 coisas que você sente no corpo',
    hint: 'Pés no chão, tecido da roupa, temperatura da pele.',
  },
  {
    count: 3,
    sense: 'audição',
    prompt: '3 sons que você ouve',
    hint: 'Perto ou longe. Até o silêncio conta.',
  },
  {
    count: 2,
    sense: 'olfato',
    prompt: '2 cheiros que você nota',
    hint: 'Ar, ambiente, pele. Se não houver, imagine um que acalma.',
  },
  {
    count: 1,
    sense: 'paladar',
    prompt: '1 sabor ou textura na boca',
    hint: 'Língua, dentes, um gole de água se tiver.',
  },
]

export function groundingStepAt(index: number): GroundingStep | undefined
{
  return GROUNDING_STEPS[index]
}
