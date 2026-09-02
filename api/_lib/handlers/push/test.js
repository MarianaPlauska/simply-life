// POST /api/push-test — Web + Expo

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { getUserFromBearer, corsJson } from '../../supabaseUser.js'
import { isWebPushConfigured } from '../../webPush.js'
import { enrichPushPayload } from '../../pushActionPayload.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { sendPushToSubscriptions } from '../../sendPushFanout.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, {
    route: 'push-test',
    limit: 5,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key, provider')
    .eq('user_id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  if (!rows?.length)
  {
    return res.status(400).json({
      error: 'Nenhuma inscrição push. Permita notificações no app (web ou Expo).',
    })
  }

  const hasWeb = rows.some((r) => r.provider !== 'expo')
  if (hasWeb && !isWebPushConfigured())
  {
    // ainda pode enviar só Expo
    const onlyExpo = rows.filter((r) => r.provider === 'expo')
    if (!onlyExpo.length)
    {
      return res.status(503).json({ error: 'Web Push não configurado (VAPID)' })
    }
  }

  const payload = enrichPushPayload({
    title: 'Simply-Life · teste',
    body: 'Push OK — web ou Expo. Toque para abrir o app.',
    url: '/kanban?foco=1',
    tag: 'simply-life-test',
  }, {
    userId: user.id,
    kind: 'mood',
    snoozeKey: `test:${user.id}`,
    nudgeKey: `test:${new Date().toISOString().slice(0, 10)}`,
  })

  const { sent } = await sendPushToSubscriptions(supabase, rows, payload)
  return res.status(200).json({ ok: true, sent })
}
