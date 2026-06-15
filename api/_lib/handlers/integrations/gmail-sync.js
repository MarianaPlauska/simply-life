// POST /api/integrations/gmail/sync — sync manual Gmail + ingest Groq

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { resolveGoogleAccessToken } from '../../googleOAuth.js';
import { fetchUnreadEmails } from '../../gmailClient.js';
import { ingestGmailBatch } from '../../gmailIngestRunner.js';
import { corsJson, getUserFromBearer } from '../../supabaseUser.js';

export default async function handler(req, res)
{
  corsJson(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const user = await getUserFromBearer(req);
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  const accessToken = await resolveGoogleAccessToken(supabase, user.id);
  if (!accessToken)
  {
    return res.status(400).json({
      error: 'Google não conectado. Autorize em Configurações → Integrações.',
    });
  }

  try
  {
    const emails = await fetchUnreadEmails(accessToken, 30);

    const { data: keywords } = await supabase
      .from('palavras_chave')
      .select('termo')
      .eq('user_id', user.id);

    const userKeywords = (keywords || []).map((k) => k.termo);

    const result = await ingestGmailBatch(
      supabase,
      user.id,
      emails,
      accessToken,
      userKeywords,
    );

    await supabase
      .from('oauth_tokens')
      .update({ last_gmail_sync_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('provider', 'google');

    return res.status(200).json({
      emails_lidos: result.processed,
      tarefas_geradas: result.succeeded,
    });
  }
  catch (err)
  {
    console.error('[gmail/sync]', err);
    const msg = err?.message || 'Erro no sync Gmail';
    if (msg.includes('403'))
    {
      return res.status(403).json({
        error: 'Permissão Gmail negada. Reconecte e autorize acesso ao e-mail.',
      });
    }
    return res.status(500).json({ error: msg });
  }
}
