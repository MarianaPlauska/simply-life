// Handler - VAPID (web) + Expo Push tokens

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { getUserFromBearer, corsJson } from '../../supabaseUser.js';
import { getVapidPublicKey, isWebPushConfigured } from '../../webPush.js';
import { isExpoPushToken } from '../../expoPush.js';

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
      expoSupported: true,
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
    const endpoint = req.body?.endpoint || req.body?.token || req.query?.endpoint;
    if (!endpoint)
    {
      return res.status(400).json({ error: 'endpoint ou token obrigatório' });
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

  // ── Expo ──────────────────────────────────────────────
  const provider = req.body?.provider;
  const expoToken = req.body?.token;
  if (provider === 'expo' || isExpoPushToken(expoToken))
  {
    if (!isExpoPushToken(expoToken))
    {
      return res.status(400).json({ error: 'token Expo inválido' });
    }

    const platform = typeof req.body?.platform === 'string' ? req.body.platform : null;
    const payload = {
      user_id: user.id,
      endpoint: expoToken,
      p256dh: 'expo',
      auth_key: 'expo',
      provider: 'expo',
      platform,
    };
    let { error } = await supabase.from('push_subscriptions').upsert(payload, {
      onConflict: 'user_id,endpoint',
    });

    if (error && /provider|platform/i.test(error.message || ''))
    {
      const retry = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: expoToken,
        p256dh: 'expo',
        auth_key: 'expo',
      }, { onConflict: 'user_id,endpoint' });
      error = retry.error;
    }

    if (error)
    {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, provider: 'expo' });
  }

  // ── Web Push ──────────────────────────────────────────
  if (!isWebPushConfigured())
  {
    return res.status(503).json({ error: 'Web Push não configurado no servidor' });
  }

  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth)
  {
    return res.status(400).json({ error: 'subscription inválida' });
  }

  let { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth_key: sub.keys.auth,
    provider: 'web',
    platform: 'web',
  }, { onConflict: 'user_id,endpoint' });

  if (error && /provider|platform/i.test(error.message || ''))
  {
    const retry = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth_key: sub.keys.auth,
    }, { onConflict: 'user_id,endpoint' });
    error = retry.error;
  }

  if (error)
  {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, provider: 'web' });
}
