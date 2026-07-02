// Economia de XP — progressão lenta e previsível (Duolingo / Finch endgame)

/** XP total necessário para subir um nível (~5–8 dias ativos com teto diário) */
export const XP_PER_LEVEL = 500

/** Teto diário — impede rush no primeiro dia */
export const DAILY_XP_CAP = 90

const DAILY_KEY_PREFIX = 'axel-xp-daily'

function todayKey(): string
{
  return new Date().toISOString().slice(0, 10)
}

function dailyStorageKey(): string
{
  return `${DAILY_KEY_PREFIX}:${todayKey()}`
}

export function getDailyXpUsed(): number
{
  try
  {
    const raw = localStorage.getItem(dailyStorageKey())
    return raw ? Math.max(0, parseInt(raw, 10) || 0) : 0
  }
  catch
  {
    return 0
  }
}

export function getDailyXpRemaining(): number
{
  return Math.max(0, DAILY_XP_CAP - getDailyXpUsed())
}

function recordDailyXp(amount: number): void
{
  try
  {
    const next = getDailyXpUsed() + amount
    localStorage.setItem(dailyStorageKey(), String(next))
  }
  catch { /* ignore */ }
}

/** Nível derivado do XP acumulado */
export function levelFromTotalXp(totalXp: number): number
{
  return Math.max(1, Math.floor(totalXp / XP_PER_LEVEL) + 1)
}

/** XP dentro do nível atual */
export function xpProgressInLevel(totalXp: number): { xpInLevel: number; xpToNext: number; pct: number }
{
  const xpInLevel = totalXp % XP_PER_LEVEL
  const pct = Math.min(100, Math.round((xpInLevel / XP_PER_LEVEL) * 100))
  return { xpInLevel, xpToNext: XP_PER_LEVEL, pct }
}

/** Aplica teto diário antes de creditar XP */
export function capXpGrant(requested: number): { granted: number; capped: boolean }
{
  const remaining = getDailyXpRemaining()
  if (remaining <= 0)
  {
    return { granted: 0, capped: true }
  }
  const granted = Math.min(requested, remaining)
  if (granted > 0)
  {
    recordDailyXp(granted)
  }
  return { granted, capped: granted < requested }
}

/** XP por conclusão de tarefa — score alto não pula níveis */
export function xpFromTaskScore(score: number): number
{
  const base = Math.max(8, Math.round((score || 20) * 0.22))
  return Math.min(28, base)
}

/** XP por sessão de foco */
export const XP_FOCUS_SESSION = 12
