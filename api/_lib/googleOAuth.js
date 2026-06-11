// OAuth Google — URL, troca de code e refresh de token

const GMAIL_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

export function getGoogleConfig()
{
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
    || `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5173'}/google-callback`;

  if (!clientId || !clientSecret)
  {
    throw new Error('GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são obrigatórios');
  }

  return { clientId, clientSecret, redirectUri };
}

export function buildGoogleAuthUrl(userId)
{
  const { clientId, redirectUri } = getGoogleConfig();
  const state = Buffer.from(JSON.stringify({ uid: userId, ts: Date.now() })).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}`, state };
}

export function parseOAuthState(state)
{
  if (!state) return null;
  try
  {
    const json = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
    return json?.uid || null;
  }
  catch
  {
    return null;
  }
}

export async function exchangeCodeForTokens(code)
{
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok)
  {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${err}`);
  }

  return res.json();
}

export async function refreshAccessToken(refreshToken)
{
  const { clientId, clientSecret } = getGoogleConfig();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok)
  {
    throw new Error(`Google refresh failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Garante access_token válido para chamadas Gmail API.
 */
export async function resolveGoogleAccessToken(supabase, userId)
{
  const { data: row, error } = await supabase
    .from('oauth_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle();

  if (error || !row)
  {
    return null;
  }

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const stillValid = expiresAt > Date.now() + 60_000;

  if (stillValid)
  {
    return row.access_token;
  }

  if (!row.refresh_token)
  {
    return row.access_token;
  }

  const refreshed = await refreshAccessToken(row.refresh_token);
  const newExpires = new Date(Date.now() + (refreshed.expires_in || 3600) * 1000).toISOString();

  await supabase
    .from('oauth_tokens')
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpires,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google');

  return refreshed.access_token;
}

export async function upsertGoogleTokens(supabase, userId, tokenPayload)
{
  const expiresAt = new Date(
    Date.now() + (tokenPayload.expires_in || 3600) * 1000,
  ).toISOString();

  const row = {
    user_id: userId,
    provider: 'google',
    access_token: tokenPayload.access_token,
    refresh_token: tokenPayload.refresh_token || null,
    expires_at: expiresAt,
    scopes: GMAIL_SCOPES,
    updated_at: new Date().toISOString(),
    gmail_sync_enabled: true,
  };

  const { error } = await supabase
    .from('oauth_tokens')
    .upsert(row, { onConflict: 'user_id,provider' });

  if (error)
  {
    throw new Error(error.message);
  }
}
