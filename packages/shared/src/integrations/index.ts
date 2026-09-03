export type AuthedJsonFetch = (
  path: string,
  init?: { method?: string; body?: unknown },
) => Promise<{ ok: boolean; json: Record<string, unknown> }>

export type GmailImapStatus = {
  configured: boolean
  email: string | null
  last_sync_at: string | null
  mailbox_folder: string | null
}

export type GoogleConnectionStatus = {
  connected: boolean
  last_gmail_sync_at: string | null
  gmail_sync_enabled: boolean
}

export type GmailSyncResult = {
  emails_lidos: number
  tarefas_geradas: number
}

function asRecord(json: Record<string, unknown>): Record<string, unknown>
{
  return json
}

export async function fetchGmailImapStatus(
  api: AuthedJsonFetch,
): Promise<GmailImapStatus>
{
  const res = await api('/api/integrations/gmail/imap-status')
  if (!res.ok)
  {
    return { configured: false, email: null, last_sync_at: null, mailbox_folder: 'INBOX' }
  }
  const d = asRecord(res.json)
  return {
    configured: Boolean(d.configured),
    email: typeof d.email === 'string' ? d.email : null,
    last_sync_at: typeof d.last_sync_at === 'string' ? d.last_sync_at : null,
    mailbox_folder: typeof d.mailbox_folder === 'string' ? d.mailbox_folder : 'INBOX',
  }
}

export async function saveGmailImapSettings(
  api: AuthedJsonFetch,
  email: string,
  appPassword: string,
  mailboxFolder = 'INBOX',
): Promise<void>
{
  const res = await api('/api/integrations/gmail/imap-settings', {
    method: 'POST',
    body: {
      email,
      app_password: appPassword,
      mailbox_folder: mailboxFolder,
    },
  })
  if (!res.ok)
  {
    throw new Error(String(res.json.error || 'Não foi possível salvar'))
  }
}

export async function syncGmailImap(api: AuthedJsonFetch): Promise<GmailSyncResult>
{
  const res = await api('/api/integrations/gmail/imap-sync', { method: 'POST' })
  if (!res.ok)
  {
    throw new Error(String(res.json.error || 'Erro no sync Gmail'))
  }
  return {
    emails_lidos: Number(res.json.emails_lidos) || 0,
    tarefas_geradas: Number(res.json.tarefas_geradas) || 0,
  }
}

export async function sendGmailImapTestMail(api: AuthedJsonFetch): Promise<void>
{
  const res = await api('/api/integrations/gmail/imap-test-mail', { method: 'POST' })
  if (!res.ok)
  {
    throw new Error(String(res.json.error || 'Falha ao enviar e-mail de teste'))
  }
}

export async function fetchGoogleStatus(
  api: AuthedJsonFetch,
): Promise<GoogleConnectionStatus>
{
  const res = await api('/api/integrations/google/status')
  if (!res.ok)
  {
    return { connected: false, last_gmail_sync_at: null, gmail_sync_enabled: false }
  }
  const d = asRecord(res.json)
  return {
    connected: Boolean(d.connected),
    last_gmail_sync_at: typeof d.last_gmail_sync_at === 'string' ? d.last_gmail_sync_at : null,
    gmail_sync_enabled: Boolean(d.gmail_sync_enabled),
  }
}

export async function startGoogleOAuth(api: AuthedJsonFetch): Promise<{
  url: string
  state?: string
}>
{
  const res = await api('/api/integrations/google/url')
  if (!res.ok)
  {
    throw new Error(String(res.json.error || 'Não foi possível iniciar OAuth Google'))
  }
  const url = String(res.json.url || '')
  if (!url) throw new Error('URL OAuth ausente')
  return {
    url,
    state: typeof res.json.state === 'string' ? res.json.state : undefined,
  }
}

export async function completeGoogleOAuth(
  api: AuthedJsonFetch,
  code: string,
  state: string | null,
): Promise<boolean>
{
  const res = await api('/api/integrations/google/callback', {
    method: 'POST',
    body: { code, state },
  })
  if (!res.ok)
  {
    throw new Error(String(res.json.error || 'Falha ao conectar Google'))
  }
  return true
}

export async function disconnectGoogle(api: AuthedJsonFetch): Promise<void>
{
  const res = await api('/api/integrations/google/disconnect', { method: 'DELETE' })
  if (!res.ok) throw new Error('Não foi possível desconectar')
}

export async function syncGmailNow(api: AuthedJsonFetch): Promise<GmailSyncResult>
{
  const res = await api('/api/integrations/gmail/sync', { method: 'POST' })
  if (!res.ok)
  {
    throw new Error(String(res.json.error || 'Erro no sync Gmail'))
  }
  return {
    emails_lidos: Number(res.json.emails_lidos) || 0,
    tarefas_geradas: Number(res.json.tarefas_geradas) || 0,
  }
}
