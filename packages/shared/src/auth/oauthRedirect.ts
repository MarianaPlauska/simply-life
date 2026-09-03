/**
 * Builders de redirect OAuth / recovery - Expo e PWA.
 */

export function buildAuthCallbackUrl(origin: string, path = '/auth/callback'): string
{
  const base = origin.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

export function buildGoogleCallbackUrl(origin: string): string
{
  return buildAuthCallbackUrl(origin, '/google-callback')
}

export function buildResetPasswordUrl(origin: string): string
{
  return buildAuthCallbackUrl(origin, '/reset-password')
}

export function buildJoinUrl(origin: string, code: string): string
{
  return `${origin.replace(/\/$/, '')}/join/${code.toUpperCase()}`
}

/** Código aleatório de convite (mesmo alfabeto do PWA) */
export function randomFriendInviteCode(): string
{
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 8; i++)
  {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export type AuthCallbackParams = {
  code: string | null
  accessToken: string | null
  refreshToken: string | null
  type: string | null
  error: string | null
  state: string | null
}

/** Extrai code/hash de um href de OAuth ou recovery. */
export function parseAuthCallbackParams(href: string): AuthCallbackParams
{
  let url: URL
  try
  {
    url = new URL(href)
  }
  catch
  {
    return {
      code: null,
      accessToken: null,
      refreshToken: null,
      type: null,
      error: null,
      state: null,
    }
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  return {
    code: url.searchParams.get('code'),
    accessToken: hash.get('access_token') || url.searchParams.get('access_token'),
    refreshToken: hash.get('refresh_token') || url.searchParams.get('refresh_token'),
    type: hash.get('type') || url.searchParams.get('type'),
    error: url.searchParams.get('error') || hash.get('error'),
    state: url.searchParams.get('state'),
  }
}
