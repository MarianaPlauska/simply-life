/** Economia de XP - progressão lenta (portado do PWA, storage injetável) */

export const XP_PER_LEVEL = 500
export const DAILY_XP_CAP = 90
export const XP_FOCUS_SESSION = 12

export type XpStorage = {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

function todayKey(): string
{
  return new Date().toISOString().slice(0, 10)
}

function dailyStorageKey(): string
{
  return `axel-xp-daily:${todayKey()}`
}

export function getDailyXpUsed(storage: XpStorage): number
{
  try
  {
    const raw = storage.getItem(dailyStorageKey())
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0
  }
  catch
  {
    return 0
  }
}

export function getDailyXpRemaining(storage: XpStorage): number
{
  return Math.max(0, DAILY_XP_CAP - getDailyXpUsed(storage))
}

function recordDailyXp(storage: XpStorage, amount: number): void
{
  try
  {
    const next = getDailyXpUsed(storage) + amount
    storage.setItem(dailyStorageKey(), String(next))
  }
  catch
  {
    /* ignore */
  }
}

export function levelFromTotalXp(totalXp: number): number
{
  return Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1)
}

export function xpProgressInLevel(totalXp: number): { xpInLevel: number; xpToNext: number; pct: number }
{
  const xpInLevel = totalXp % XP_PER_LEVEL
  const pct = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100))
  return { xpInLevel, xpToNext: XP_PER_LEVEL, pct }
}

export function capXpGrant(
  storage: XpStorage,
  requested: number,
): { granted: number; capped: boolean }
{
  const remaining = getDailyXpRemaining(storage)
  if (remaining <= 0) return { granted: 0, capped: true }
  const granted = Math.min(requested, remaining)
  if (granted > 0) recordDailyXp(storage, granted)
  return { granted, capped: granted < requested }
}

export function refundDailyXp(storage: XpStorage, amount: number): void
{
  if (amount <= 0) return
  try
  {
    const next = Math.max(0, getDailyXpUsed(storage) - amount)
    storage.setItem(dailyStorageKey(), String(next))
  }
  catch
  {
    /* ignore */
  }
}

export function xpFromTaskScore(score: number): number
{
  const base = Math.max(8, Math.round((score || 20) * 0.22))
  return Math.min(28, base)
}
