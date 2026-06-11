// Gmail via IMAP + senha de app — gratuito, sem Google Cloud OAuth

import { ImapFlow } from 'imapflow'

function parseAddress(envelope)
{
  const from = envelope?.from?.[0]
  if (!from) return 'desconhecido'
  if (from.name) return from.name
  return from.address || 'desconhecido'
}

/**
 * @param {string} email
 * @param {string} appPassword
 * @param {number} maxResults
 */
export async function fetchUnreadViaImap(email, appPassword, maxResults = 25)
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

  await client.connect()

  try
  {
    const lock = await client.getMailboxLock('INBOX')
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

        emails.push({
          id: String(msg.uid),
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
