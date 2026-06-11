import { supabase } from './supabase'

async function authHeaders(): Promise<Record<string, string>>
{
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token)
  {
    throw new Error('Não autenticado')
  }

  return { Authorization: `Bearer ${session.access_token}` }
}

export interface GoogleConnectionStatus
{
  connected: boolean
  last_gmail_sync_at: string | null
  gmail_sync_enabled: boolean
}

export async function fetchGoogleStatus(): Promise<GoogleConnectionStatus>
{
  const res = await fetch('/api/integrations/google/status', {
    headers: await authHeaders(),
  })

  if (!res.ok)
  {
    return { connected: false, last_gmail_sync_at: null, gmail_sync_enabled: false }
  }

  return res.json() as Promise<GoogleConnectionStatus>
}

export async function startGoogleOAuth(): Promise<string>
{
  const res = await fetch('/api/integrations/google/url', {
    headers: await authHeaders(),
  })

  if (!res.ok)
  {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || 'Não foi possível iniciar OAuth Google')
  }

  const data = await res.json() as { url: string; state?: string }
  if (data.state)
  {
    sessionStorage.setItem('axel-google-oauth-state', data.state)
  }

  return data.url
}

export async function completeGoogleOAuth(code: string, state: string | null): Promise<boolean>
{
  const saved = sessionStorage.getItem('axel-google-oauth-state')
  sessionStorage.removeItem('axel-google-oauth-state')

  const res = await fetch('/api/integrations/google/callback', {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      state: state || saved,
    }),
  })

  if (!res.ok)
  {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || 'Falha ao conectar Google')
  }

  return true
}

export async function disconnectGoogle(): Promise<void>
{
  const res = await fetch('/api/integrations/google/disconnect', {
    method: 'DELETE',
    headers: await authHeaders(),
  })

  if (!res.ok)
  {
    throw new Error('Não foi possível desconectar')
  }
}

export async function syncGmailNow(): Promise<{ emails_lidos: number; tarefas_geradas: number }>
{
  const res = await fetch('/api/integrations/gmail/sync', {
    method: 'POST',
    headers: await authHeaders(),
  })

  const data = await res.json().catch(() => ({})) as {
    emails_lidos?: number
    tarefas_geradas?: number
    error?: string
  }

  if (!res.ok)
  {
    throw new Error(data.error || 'Erro no sync Gmail')
  }

  return {
    emails_lidos: data.emails_lidos ?? 0,
    tarefas_geradas: data.tarefas_geradas ?? 0,
  }
}
