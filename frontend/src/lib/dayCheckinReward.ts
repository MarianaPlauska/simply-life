import { useTaskStore } from '../store/useTaskStore'

const CHECKIN_XP = 5
const XP_KEY_PREFIX = 'simply-life:day-checkin-xp:'

function todayIsoDate(): string
{
  return new Date().toISOString().slice(0, 10)
}

function xpGrantedToday(): boolean
{
  try
  {
    return localStorage.getItem(`${XP_KEY_PREFIX}${todayIsoDate()}`) === '1'
  }
  catch
  {
    return false
  }
}

function markXpGranted(): void
{
  try
  {
    localStorage.setItem(`${XP_KEY_PREFIX}${todayIsoDate()}`, '1')
  }
  catch
  {
    // storage bloqueado - o addXP ainda é idempotente pelo lastActiveDate
  }
}

/** Abrir o resumo do dia mantém a ofensiva (1× por dia). */
export function recordHomeDayCheckin(): void
{
  useTaskStore.getState().recordDayCheckin()
}

/** XP mínimo silencioso - depois que user_stats já estiver hidratado. */
export async function grantDailyCheckinXp(): Promise<void>
{
  if (xpGrantedToday())
  {
    return
  }

  markXpGranted()
  await useTaskStore.getState().addXP('foco', CHECKIN_XP, { silent: true })
}
