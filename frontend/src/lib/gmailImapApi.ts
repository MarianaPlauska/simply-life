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

export interface GmailImapStatus
{
  configured: boolean
  email: string | null
  last_sync_at: string | null
  mailbox_folder: string | null
}

export async function fetchGmailImapStatus(): Promise<GmailImapStatus>
{
  const res = await fetch('/api/integrations/gmail/imap-status', {
    headers: await authHeaders(),
  })

  if (!res.ok)
  {
    return { configured: false, email: null, last_sync_at: null, mailbox_folder: 'INBOX' }
  }

  return res.json() as Promise<GmailImapStatus>
}

export async function saveGmailImapSettings(
  email: string,
  appPassword: string,
  mailboxFolder = 'INBOX',
): Promise<void>
{
  const res = await fetch('/api/integrations/gmail/imap-settings', {
    method: 'POST',
    headers: {
      ...(await authHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      app_password: appPassword,
      mailbox_folder: mailboxFolder,
    }),
  })

  if (!res.ok)
  {
    const err = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(err.error || 'Não foi possível salvar')
  }
}

export async function syncGmailImap(): Promise<{ emails_lidos: number; tarefas_geradas: number }>
{
  const res = await fetch('/api/integrations/gmail/imap-sync', {
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

export async function sendGmailImapTestMail(): Promise<void>
{
  const res = await fetch('/api/integrations/gmail/imap-test-mail', {
    method: 'POST',
    headers: await authHeaders(),
  })

  const data = await res.json().catch(() => ({})) as {
    error?: string
    oauth_required?: boolean
  }

  if (!res.ok)
  {
    if (data.oauth_required)
    {
      throw new Error(
        'O Gmail recusou SMTP com senha de app. Não usamos OAuth pago - o resumo semanal cairá só em push.',
      )
    }
    throw new Error(data.error || 'Falha ao enviar e-mail de teste')
  }
}
