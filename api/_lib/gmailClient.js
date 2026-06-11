// Cliente Gmail REST — lista não lidos e marca como lido

function parseFromHeader(headers)
{
  const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || '';
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from || 'desconhecido';
}

function parseSubjectHeader(headers)
{
  return headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '(sem assunto)';
}

/**
 * @param {string} accessToken
 * @param {number} maxResults
 */
export async function fetchUnreadEmails(accessToken, maxResults = 25)
{
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!listRes.ok)
  {
    const err = await listRes.text();
    throw new Error(`Gmail list ${listRes.status}: ${err}`);
  }

  const listData = await listRes.json();
  const refs = listData.messages || [];
  const emails = [];

  for (const ref of refs)
  {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    if (!msgRes.ok) continue;

    const msg = await msgRes.json();
    const headers = msg.payload?.headers || [];

    emails.push({
      id: msg.id,
      sender: parseFromHeader(headers),
      subject: parseSubjectHeader(headers),
      body: msg.snippet || '',
    });
  }

  return emails;
}

export async function markEmailAsRead(accessToken, messageId)
{
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
    },
  );

  if (!res.ok)
  {
    console.warn(`[gmailClient] mark read failed ${messageId}: ${res.status}`);
  }
}
