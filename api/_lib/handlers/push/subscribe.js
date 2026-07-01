// Handler — VAPID + registro push_subscriptions

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { getUserFromBearer, corsJson } from '../../supabaseUser.js';
import { getVapidPublicKey, isWebPushConfigured } from '../../webPush.js';

export default async function handler(req, res)
{
  corsJson(res, req);

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end();
  }

  if (req.method === 'GET')
  {
    return res.status(200).json({
      publicKey: getVapidPublicKey(),
      configured: isWebPushConfigured(),
    });
  }

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

  if (req.method === 'DELETE')
  {
    const endpoint = req.body?.endpoint || req.query?.endpoint;
    if (!endpoint)
    {
      return res.status(400).json({ error: 'endpoint obrigatório' });
    }

    await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', user.id)
      .eq('endpoint', endpoint);

    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isWebPushConfigured())
  {
    return res.status(503).json({ error: 'Web Push não configurado no servidor' });
  }

  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth)
  {
    return res.status(400).json({ error: 'subscription inválida' });
  }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth_key: sub.keys.auth,
  }, { onConflict: 'user_id,endpoint' });

  if (error)
  {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true });
}
