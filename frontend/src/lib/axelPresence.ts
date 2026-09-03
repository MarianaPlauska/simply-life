import type { CapacityMode } from './dayCapacity'

export type AxelPresence = 'calmo' | 'atento' | 'positivo'

/** Presença visual do AXEL na Home - nunca o cinza triste padrão */
export function resolveAxelPresence(input: {
  hasMoodToday: boolean
  moodLevel: number
  capacityMode: CapacityMode
}): AxelPresence
{
  if (!input.hasMoodToday)
  {
    return 'calmo'
  }

  if (input.capacityMode === 'pleno' || input.moodLevel >= 4)
  {
    return 'positivo'
  }

  if (input.capacityMode === 'cuidado' || input.capacityMode === 'critico' || input.moodLevel <= 2)
  {
    return 'atento'
  }

  return 'calmo'
}

export const AXEL_PRESENCE_LABEL: Record<AxelPresence, string> = {
  calmo: 'Calmo',
  atento: 'Atento',
  positivo: 'Positivo',
}
