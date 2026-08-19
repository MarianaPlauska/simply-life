// POST autenticado — dispara o resumo da semana para o usuário logado

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { getUserFromBearer, corsJson } from '../../supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { runWeeklyDigests } from '../cron/weekly-digest.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, {
    route: 'weekly-digest-test',
    limit: 3,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  const data = await runWeeklyDigests(supabase, { forceUserId: user.id })
  return res.status(200).json({ ok: true, ...data })
}
