// Rotação de frases AXEL - cache local + persistência em user_workspace_prefs (Supabase)

import { saveWorkspacePrefs } from './userWorkspacePrefs'

const LEGACY_KEY = 'axel-care-rotation-v1'

let rotationState: Record<string, number> = {}
let persistTimer: ReturnType<typeof setTimeout> | null = null

export function hydrateAxelCareRotation(fromPrefs?: Record<string, number> | null): void
{
  if (fromPrefs && Object.keys(fromPrefs).length > 0)
  {
    rotationState = { ...fromPrefs }
    return
  }

  try
  {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '{}') as Record<string, number>
    rotationState = { ...legacy }
  }
  catch
  {
    rotationState = {}
  }
}

export function getAxelCareRotationState(): Record<string, number>
{
  return { ...rotationState }
}

export function pickRotatingFromPool(pool: string[], key: string): string
{
  if (pool.length === 0) return ''
  const idx = rotationState[key] ?? 0
  const message = pool[idx % pool.length]
  rotationState[key] = (idx + 1) % pool.length
  schedulePersistRotation()
  return message
}

function schedulePersistRotation(): void
{
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() =>
  {
    void persistRotation()
  }, 400)
}

async function persistRotation(): Promise<void>
{
  try
  {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(rotationState))
    await saveWorkspacePrefs({ axel_care_rotation: { ...rotationState } })
  }
  catch
  {
    /* offline */
  }
}

/** Primeiro humor do dia - oculta card no dashboard por 12h */
export function wellbeingHiddenUntilIso(): string
{
  const until = new Date()
  until.setTime(until.getTime() + 12 * 60 * 60 * 1000)
  return until.toISOString()
}

export function isWellbeingDashboardHidden(hiddenUntil: string | null | undefined): boolean
{
  if (!hiddenUntil) return false
  return Date.now() < new Date(hiddenUntil).getTime()
}

/** Após 12h do 1º humor - pede reflexão do dia */
export function isWellbeingCheckInDue(
  hiddenUntil: string | null | undefined,
  hasMoodToday: boolean,
): boolean
{
  if (!hasMoodToday || !hiddenUntil) return false
  return !isWellbeingDashboardHidden(hiddenUntil)
}
