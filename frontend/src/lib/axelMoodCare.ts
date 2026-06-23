import type { MoodLevel } from './axelCareMessages'

/** Tempo mínimo da mensagem do AXEL após registrar humor */
export const AXEL_MOOD_CARE_DURATION_MS = 60_000

export interface AxelMoodCareSession
{
  mood: MoodLevel
  message: string
  until: number
}

export function isAxelMoodCareActive(session: AxelMoodCareSession | null): boolean
{
  if (!session)
  {
    return false
  }
  return Date.now() < session.until
}
