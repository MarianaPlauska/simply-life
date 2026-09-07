const PRESENCE_ONLINE_MS = 3 * 60 * 1000

/** App aberto nos últimos 3 minutos. */
export function isUserConnected(lastSeenIso: string | null | undefined): boolean
{
  if (!lastSeenIso) return false
  const t = new Date(lastSeenIso).getTime()
  if (Number.isNaN(t)) return false
  return Date.now() - t < PRESENCE_ONLINE_MS
}
