// POST /api/push-test — dispara uma notificação de teste para as subscriptions do usuário

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { getUserFromBearer, corsJson } from '../../supabaseUser.js'
import { sendWebPush, isExpiredSubscriptionError, isWebPushConfigured } from '../../webPush.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'

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

  if (!isWebPushConfigured())
  {
    return res.status(503).json({ error: 'Web Push não configurado (VAPID)' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', user.id)

  if (error) return res.status(500).json({ error: error.message })
  if (!rows?.length)
  {
    return res.status(400).json({ error: 'Nenhuma inscrição push neste dispositivo. Permita notificações no app.' })
  }

  let sent = 0
  for (const row of rows)
  {
    try
    {
      await sendWebPush(row, {
        title: 'Simply-Life · teste',
        body: 'Push ponta a ponta ok. A Rotina Guiada e o resumo semanal usam este canal.',
        url: '/kanban?foco=1',
        tag: 'simply-life-test',
      })
      sent += 1
    }
    catch (err)
    {
      if (isExpiredSubscriptionError(err))
      {
        await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
      }
    }
  }

  return res.status(200).json({ ok: true, sent })
}
