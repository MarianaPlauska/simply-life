// POST /api/webhook-ingest — triagem M2M com keywords do usuário (+50)

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { verifyWebhookSignature } from './_lib/webhookAuth.js';
import { fetchUserKeywords, matchUserKeywords } from './_lib/keywordBoost.js';
import { scoreFromItem } from './_lib/triageScore.js';
import { insertTriagedTask } from './_lib/insertTriagedTask.js';

const FALLBACK_SECRET = process.env.WEBHOOK_INGEST_SECRET || '';

function buildItemText(item)
{
  return `${item.sender || ''} ${item.subject || ''} ${item.body || ''} ${item.titulo || ''}`;
}

export default async function handler(req, res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  let secret = FALLBACK_SECRET;
  const { data: secretRow } = await supabase
    .from('user_webhook_secrets')
    .select('secret')
    .eq('user_id', userId)
    .maybeSingle();
  if (secretRow?.secret) secret = secretRow.secret;

  if (!verifyWebhookSignature(bodyRaw, req.headers['x-webhook-signature'] || '', secret))
  {
    return res.status(401).json({ error: 'Assinatura HMAC inválida ou secret ausente' });
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
