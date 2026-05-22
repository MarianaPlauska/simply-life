/** Deep Work: 3 tarefas com score > 80 concluídas antes do meio-dia (horário local) */

export const DEEP_WORK_MORNING_HOUR_LIMIT = 12;

export function isMorningDeepWorkWindow(date = new Date()): boolean
{
  return date.getHours() < DEEP_WORK_MORNING_HOUR_LIMIT;
}

export function todayKey(date = new Date()): string
{
  return date.toISOString().split('T')[0];
}

export function readMorningDeepWorkCount(): number
{
  try
  {
    const key = `jarvis_deep_work_${todayKey()}`;
    return parseInt(sessionStorage.getItem(key) || '0', 10) || 0;
  }
  catch
  {
    return 0;
  }
}

export function incrementMorningDeepWorkCount(): number
{
  const storageKey = `jarvis_deep_work_${todayKey()}`;
  const next = readMorningDeepWorkCount() + 1;
  try
  {
    sessionStorage.setItem(storageKey, String(next));
  }
  catch { /* private mode */ }
  return next;
}

export function wasDeepWorkBonusGrantedToday(): boolean
{
  try
  {
    return sessionStorage.getItem(`jarvis_deep_work_bonus_${todayKey()}`) === '1';
  }
  catch
  {
    return false;
  }
}

export function markDeepWorkBonusGranted(): void
{
  try
  {
    sessionStorage.setItem(`jarvis_deep_work_bonus_${todayKey()}`, '1');
  }
  catch { /* private mode */ }
}

export function qualifiesForDeepWorkStreak(scoreUrgencia?: number): boolean
{
  return (scoreUrgencia || 0) > 80 && isMorningDeepWorkWindow();
}
