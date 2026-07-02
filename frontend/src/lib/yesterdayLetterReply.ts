// Resposta editável à carta do eu de ontem — loop emocional

import { readScopedJson, writeScopedJson } from './userScopedStorage'

const STORAGE_KEY = 'axel-yesterday-letter-reply'

export interface YesterdayLetterReply
{
  dateIso: string
  text: string
  updatedAt: string
}

function todayIso(): string
{
  return new Date().toISOString().slice(0, 10)
}

export function loadYesterdayLetterReply(): YesterdayLetterReply | null
{
  const stored = readScopedJson<YesterdayLetterReply>(STORAGE_KEY)
  if (!stored?.dateIso) return null
  if (stored.dateIso !== todayIso()) return null
  return stored
}

export function saveYesterdayLetterReply(text: string): YesterdayLetterReply
{
  const payload: YesterdayLetterReply = {
    dateIso: todayIso(),
    text: text.trim(),
    updatedAt: new Date().toISOString(),
  }
  writeScopedJson(STORAGE_KEY, payload)
  return payload
}

export function clearYesterdayLetterReply(): void
{
  writeScopedJson(STORAGE_KEY, null)
}
