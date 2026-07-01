import { extractWebhookBearer, verifyWebhookBearer } from './webhookSecretHash.js';
import { verifyWebhookSignature } from './webhookAuth.js';

/**
 * Valida webhook M2M: Bearer (hash no banco) + HMAC do body.
 * O plaintext só existe na requisição — nunca é lido do Postgres.
 */
export async function resolveWebhookPlainSecret(supabase, userId, req, bodyRaw)
{
  const bearer = extractWebhookBearer(req);
  const sig = req.headers['x-webhook-signature'] || '';

  const { data: row } = await supabase
    .from('user_webhook_secrets')
    .select('secret_hash')
    .eq('user_id', userId)
    .maybeSingle();

  if (row?.secret_hash)
  {
    if (!bearer || !verifyWebhookBearer(bearer, row.secret_hash))
    {
      return { ok: false, status: 401, error: 'Bearer do webhook inválido' };
    }

    if (!verifyWebhookSignature(bodyRaw, sig, bearer))
    {
      return { ok: false, status: 401, error: 'Assinatura HMAC inválida' };
    }

    return { ok: true, plain: bearer };
  }

  const fallback = process.env.WEBHOOK_INGEST_SECRET || '';
  if (!fallback)
  {
    return { ok: false, status: 401, error: 'Webhook não configurado para este usuário' };
  }

  if (bearer && bearer === fallback && verifyWebhookSignature(bodyRaw, sig, bearer))
  {
    return { ok: true, plain: bearer };
  }

  if (verifyWebhookSignature(bodyRaw, sig, fallback))
  {
    return { ok: true, plain: fallback };
  }

  return { ok: false, status: 401, error: 'Assinatura HMAC inválida ou secret ausente' };
}
