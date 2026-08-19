// POST /api/webhook-ingest — triagem M2M com keywords do usuário (+50)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { resolveWebhookPlainSecret } from '../../resolveWebhookAuth.js';
import { fetchUserKeywords, matchUserKeywords } from '../../keywordBoost.js';
import { scoreFromItem } from '../../triageScore.js';
import { insertTriagedTask } from '../../insertTriagedTask.js';
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js';

function buildItemText(item)
{
  return `${item.sender || ''} ${item.subject || ''} ${item.body || ''} ${item.titulo || ''}`;
}

export default async function handler(req, res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Signature, X-Webhook-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const limited = await enforceRateLimit(req, {
    route: 'webhook-ingest',
    limit: 60,
    windowSec: 60,
  });
  if (!limited.ok)
  {
    return sendRateLimited(res, limited.retryAfter);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

  const bodyRaw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  let payload;
  try
  {
    payload = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(bodyRaw);
  }
  catch
  {
    return res.status(422).json({ error: 'JSON inválido' });
  }

  const { user_id: userId, items } = payload;
  if (!userId || !Array.isArray(items) || items.length === 0)
  {
    return res.status(400).json({ error: 'user_id e items[] são obrigatórios' });
  }

  const auth = await resolveWebhookPlainSecret(supabase, userId, req, bodyRaw);
  if (!auth.ok)
  {
    return res.status(auth.status).json({ error: auth.error });
  }

  const userKeywords = await fetchUserKeywords(supabase, userId);
  const results = [];

  for (const item of items)
  {
    const text = buildItemText(item);
    const { boost, matched } = matchUserKeywords(text, userKeywords);

    const scored = scoreFromItem(item, {
      titulo: item.titulo || item.subject,
      snippet: (item.body || item.subject || '').substring(0, 100),
      is_urgent: Boolean(item.is_urgent),
      is_vip: Boolean(item.is_vip),
      is_bug: Boolean(item.is_bug),
      is_noise: Boolean(item.is_noise),
    }, boost);

    const { data: inserted, error: insertErr } = await insertTriagedTask(supabase, userId, item, scored);

    if (insertErr)
    {
      results.push({ success: false, error: insertErr.message, subject: item.subject });
      continue;
    }

    results.push({
      success: true,
      id: inserted.id,
      titulo: inserted.titulo,
      score_urgencia: inserted.score_urgencia,
      prioridade: inserted.prioridade,
      breakdown: scored.breakdown,
      keyword_boost: boost,
      keywords_matched: matched,
    });
  }

  return res.status(200).json({ status: 'ok', processed: results.length, results });
}
