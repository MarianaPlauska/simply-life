import { localTodayIso } from '../dates'
import { humorDoDia, type HumorRegistro } from '../mood'

/** Humor 1–2 no dia dispara o modo suave na aba Hoje. */
export const SOFT_MOOD_MAX = 2

export function isSoftMoodDay(humor: HumorRegistro[], ref = new Date()): boolean
{
  const today = humorDoDia(humor, localTodayIso(ref))
  return today != null && today.humor <= SOFT_MOOD_MAX
}
