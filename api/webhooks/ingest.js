// POST /api/webhooks/ingest — ingestão universal com orquestração de urgência antes do insert

import { getSupabaseAdmin } from '../_lib/supabaseAdmin.js';
import { verifyWebhookSignature } from '../_lib/webhookAuth.js';
import { orchestrateIngestPayload } from '../_lib/urgencyOrchestrator.js';
import { ensureProjectLabel, linkLabelToTask } from '../_lib/projectLabels.js';
import { insertTriagedTask } from '../_lib/insertTriagedTask.js';

const FALLBACK_SECRET = process.env.WEBHOOK_INGEST_SECRET || '';

function cors(res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Signature');
}

/**
 * Normaliza body único ou lote legado.
 */
function normalizePayload(body)
{
  if (body.source && body.title)
  {
    return {
      userId: body.user_id,
      items: [{
        source: body.source,
        title: body.title,
        content: body.content || '',
        priority: body.priority,
      }],
    };
  }

  if (body.user_id && Array.isArray(body.items))
  {
    return {
      userId: body.user_id,
      items: body.items.map((item) => ({
        source: item.source || item.origem || 'webhook',
        title: item.title || item.subject || item.titulo || '(sem título)',
        content: item.content || item.body || '',
        priority: item.priority || item.prioridade,
      })),
    };
  }

  return null;
}

export default async function handler(req, res)
{
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

  const bodyRaw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  let body;
  try
  {
    body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(bodyRaw);
  }
  catch
  {
    return res.status(422).json({ error: 'JSON inválido' });
  }

  const normalized = normalizePayload(body);
  if (!normalized?.userId || !normalized.items?.length)
  {
    return res.status(400).json({
      error: 'Payload inválido. Use { user_id, source, title, content, priority? } ou { user_id, items[] }',
    });
  }

  const { userId, items } = normalized;

  let secret = FALLBACK_SECRET;
  const { data: secretRow } = await supabase
    .from('user_webhook_secrets')
    .select('secret')
    .eq('user_id', userId)
    .maybeSingle();
  if (secretRow?.secret) secret = secretRow.secret;

  if (secret)
  {
    const sig = req.headers['x-webhook-signature'] || '';
    if (!verifyWebhookSignature(bodyRaw, sig, secret))
    {
      return res.status(401).json({ error: 'Assinatura HMAC inválida' });
    }
  }

  const results = [];

  for (const item of items)
  {
    try
    {
      // Middleware de IA — orquestra ANTES de gravar
      const orchestrated = await orchestrateIngestPayload({
        source: item.source,
        title: item.title,
        content: item.content,
        priority: item.priority,
      });

      const scored = {
        finalScore: orchestrated.score,
        prioridade: orchestrated.prioridade,
        titulo: item.title,
        snippet: (item.content || item.title || '').substring(0, 100),
        itemOrigem: item.source || 'webhook',
      };

      const extra = {
        data_vencimento: orchestrated.due_at || item.due_at || null,
        urgency_reason: orchestrated.rationale || null,
        intent_category: orchestrated.intent_category || null,
      };

      const { data: inserted, error: insertErr } = await insertTriagedTask(
        supabase,
        userId,
        {
          titulo: item.title,
          body: item.content,
          origem: item.source || 'webhook',
        },
        scored,
        extra,
      );

      if (insertErr)
      {
        results.push({ success: false, error: insertErr.message, title: item.title });
        continue;
      }

      let labelLinked = null;
      if (orchestrated.projectTag)
      {
        const label = await ensureProjectLabel(supabase, userId, orchestrated.projectTag);
        if (label?.id)
        {
          await linkLabelToTask(supabase, inserted.id, label.id);
          labelLinked = label.nome;
        }
      }

      results.push({
        success: true,
        id: inserted.id,
        titulo: inserted.titulo,
        score_urgencia: inserted.score_urgencia,
        prioridade: inserted.prioridade,
        project_tag: labelLinked || orchestrated.projectTag,
        urgency_source: orchestrated.source,
        rationale: orchestrated.rationale,
        due_at: extra.data_vencimento,
        intent_category: extra.intent_category,
      });
    }
    catch (err)
    {
      results.push({
        success: false,
        error: err?.message || 'Erro na orquestração',
        title: item.title,
      });
    }
  }

  const ok = results.filter((r) => r.success).length;

  return res.status(200).json({
    status: 'orchestrated',
    processed: results.length,
    succeeded: ok,
    results,
  });
}
