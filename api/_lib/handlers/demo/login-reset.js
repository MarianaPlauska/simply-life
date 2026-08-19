// POST /api/demo/login-reset — restaura o seed da conta demo (só o UUID/email demo)

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { getUserFromBearer, corsJson } from '../../supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { isAllowedDemoUser, resetDemoWorkspace } from '../../demoWorkspace.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, {
    route: 'demo-login-reset',
    limit: 8,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  if (!isAllowedDemoUser(user))
  {
    return res.status(403).json({ error: 'Reset permitido só na conta demo' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  try
  {
    const data = await resetDemoWorkspace(supabase, user.id)
    return res.status(200).json({ ok: true, reset: data })
  }
  catch (err)
  {
    const msg = err?.message || 'Falha ao resetar demo'
    return res.status(500).json({ error: msg })
  }
}
