// Handler — sync Gmail (OAuth + IMAP)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { resolveGoogleAccessToken } from '../../googleOAuth.js';
import { fetchUnreadEmails } from '../../gmailClient.js';
import { fetchUnreadViaImap } from '../../gmailImap.js';
import { ingestGmailBatch } from '../../gmailIngestRunner.js';
import { imapPasswordFromRow } from '../../mailer.js';

export default async function handler(req, res)
{
  if (req.method !== 'GET' && req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || '';
  if (cronSecret && auth !== `Bearer ${cronSecret}`)
  {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const { data: tokenRows, error } = await supabase
    .from('oauth_tokens')
    .select('user_id')
    .eq('provider', 'google')
    .eq('gmail_sync_enabled', true);

  if (error)
  {
    return res.status(500).json({ error: error.message });
  }

  const summary = [];

  for (const row of tokenRows || [])
  {
    try
    {
      const accessToken = await resolveGoogleAccessToken(supabase, row.user_id);
      if (!accessToken) continue;

      const emails = await fetchUnreadEmails(accessToken, 20);
      if (emails.length === 0)
      {
        summary.push({ user_id: row.user_id, processed: 0, succeeded: 0 });
        continue;
      }

      const { data: keywords } = await supabase
        .from('palavras_chave')
        .select('termo')
        .eq('user_id', row.user_id);

      const result = await ingestGmailBatch(
        supabase,
        row.user_id,
        emails,
        accessToken,
        (keywords || []).map((k) => k.termo),
      );

      await supabase
        .from('oauth_tokens')
        .update({ last_gmail_sync_at: new Date().toISOString() })
        .eq('user_id', row.user_id)
        .eq('provider', 'google');

      summary.push({
        user_id: row.user_id,
        processed: result.processed,
        succeeded: result.succeeded,
      });
    }
    catch (err)
    {
      summary.push({
        user_id: row.user_id,
        error: err?.message || 'sync failed',
      });
    }
  }

  const { data: imapRows } = await supabase
    .from('gmail_imap_settings')
    .select('user_id, email, app_password, mailbox_folder')
    .eq('enabled', true);

  for (const row of imapRows || [])
  {
    try
    {
      const emails = await fetchUnreadViaImap(
        row.email,
        imapPasswordFromRow(row),
        15,
        row.mailbox_folder || 'INBOX',
      );
      if (emails.length === 0)
      {
        summary.push({ user_id: row.user_id, mode: 'imap', processed: 0, succeeded: 0 });
        continue;
      }

      const { data: keywords } = await supabase
        .from('palavras_chave')
        .select('termo')
        .eq('user_id', row.user_id);

      const result = await ingestGmailBatch(
        supabase,
        row.user_id,
        emails,
        null,
        (keywords || []).map((k) => k.termo),
      );

      await supabase
        .from('gmail_imap_settings')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('user_id', row.user_id);

      summary.push({
        user_id: row.user_id,
        mode: 'imap',
        processed: result.processed,
        succeeded: result.succeeded,
      });
    }
    catch (err)
    {
      summary.push({
        user_id: row.user_id,
        mode: 'imap',
        error: err?.message || 'sync failed',
      });
    }
  }

  return res.status(200).json({
    status: 'ok',
    users: summary.length,
    results: summary,
  });
}
