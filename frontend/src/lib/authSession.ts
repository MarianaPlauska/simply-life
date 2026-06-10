import { supabase } from './supabase'
import type { Session } from '@supabase/supabase-js'

const SESSION_TIMEOUT_MS = 8_000

/** Sessão local de convidado — sem Supabase Auth */
export function isLocalGuestUser(userId: string): boolean
{
  return userId.startsWith('guest_')
}

/** getSession com timeout — evita spinner infinito se Supabase estiver inacessível */
export async function getSessionWithTimeout(
  timeoutMs = SESSION_TIMEOUT_MS,
): Promise<{ session: Session | null; timedOut: boolean }>
{
  let timedOut = false

  const timeoutPromise = new Promise<{ session: null; timedOut: true }>((resolve) =>
  {
    setTimeout(() =>
    {
      timedOut = true
      resolve({ session: null, timedOut: true })
    }, timeoutMs)
  })

  const sessionPromise = supabase.auth.getSession().then(({ data }) => ({
    session: data.session,
    timedOut: false as const,
  }))

  const result = await Promise.race([sessionPromise, timeoutPromise])
  return { session: result.session, timedOut: result.timedOut || timedOut }
}
