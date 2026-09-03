// Gmail via IMAP + senha de app - gratuito, sem Google Cloud OAuth

import { ImapFlow } from 'imapflow'

function parseAddress(envelope)
{
  const from = envelope?.from?.[0]
  if (!from) return 'desconhecido'
  if (from.name) return from.name
  return from.address || 'desconhecido'
}

function normalizeFolder(folder)
{
  const raw = String(folder || '').trim()
  if (!raw || raw.toUpperCase() === 'INBOX') return 'INBOX'
  return raw
}

async function lockMailboxOrInbox(client, preferred)
{
  try
  {
    return { lock: await client.getMailboxLock(preferred), mailbox: preferred }
  }
  catch (err)
  {
    if (preferred === 'INBOX') throw err
    return { lock: await client.getMailboxLock('INBOX'), mailbox: 'INBOX' }
  }
}

/**
 * @param {string} email
 * @param {string} appPassword
 * @param {number} maxResults
 * @param {string} [folder]
 */
export async function fetchUnreadViaImap(email, appPassword, maxResults = 25, folder = 'INBOX')
{
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: email,
      pass: appPassword.replace(/\s/g, ''),
    },
    logger: false,
  })

  const emails = []
  const preferred = normalizeFolder(folder)

  await client.connect()

  try
  {
    const { lock, mailbox } = await lockMailboxOrInbox(client, preferred)
    try
    {
      const uids = await client.search({ seen: false }, { uid: true })
      const batch = (uids || []).slice(0, maxResults)

      if (batch.length === 0)
      {
        return []
      }

      for await (const msg of client.fetch(batch, {
        envelope: true,
        source: true,
      }, { uid: true }))
      {
        const body = msg.source
          ? msg.source.toString('utf8').slice(0, 2000)
          : ''
        const messageId = msg.envelope?.messageId
          ? String(msg.envelope.messageId).replace(/^<|>$/g, '')
          : ''

        emails.push({
          id: messageId || `imap:${mailbox}:${msg.uid}`,
          message_id: messageId || null,
          uid: String(msg.uid),
          sender: parseAddress(msg.envelope),
          subject: msg.envelope?.subject || '(sem assunto)',
          body,
        })
      }

      await client.messageFlagsAdd(batch, ['\\Seen'], { uid: true })
    }
    finally
    {
      lock.release()
    }
  }
  finally
  {
    await client.logout()
  }

  return emails
}
