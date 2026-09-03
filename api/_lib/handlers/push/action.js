// POST /api/push-action - ações inline de notificação (feito / soneca)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { corsJson } from '../../supabaseUser.js';
import { verifyPushActionToken } from '../../pushActionToken.js';
import { executePushAction } from '../../pushActionExecute.js';
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js';

export default async function handler(req, res)
{
  corsJson(res, req);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const limited = await enforceRateLimit(req, {
    route: 'push-action',
    limit: 30,
    windowSec: 60,
  });
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter);

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const action = body.action;
  const token = body.token;

  if (!action || !token)
  {
    return res.status(400).json({ error: 'action e token são obrigatórios' });
  }

  const payload = verifyPushActionToken(token);
  if (!payload?.userId)
  {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase)
  {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try
  {
    const result = await executePushAction(supabase, payload, action);
    if (!result.ok)
    {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  }
  catch (err)
  {
    return res.status(500).json({ error: err?.message || 'Falha na ação' });
  }
}
