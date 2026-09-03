// Máximo 1 nudge de nota por dia - tom Finch, sem spam

import { readScopedJson, writeScopedJson } from './userScopedStorage'

const NOTE_NUDGE_DAY_KEY = 'axel-note-nudge-day'

function todayKey(): string
{
  return new Date().toISOString().slice(0, 10)
}

export function canEmitNoteNudgeToday(userId?: string | null): boolean
{
  const stored = readScopedJson<string>(NOTE_NUDGE_DAY_KEY, userId)
  return stored !== todayKey()
}

export function markNoteNudgeEmitted(userId?: string | null): void
{
  writeScopedJson(NOTE_NUDGE_DAY_KEY, todayKey(), userId)
}
