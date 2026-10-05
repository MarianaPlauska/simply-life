// POST /api/axel/account-delete - apaga o usuário Auth (CASCADE nos dados)

import { applyCors } from '../../cors.js'
import { getUserFromBearer, secondsSinceLastAuth } from '../../supabaseUser.js'
import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'

const REAUTH_WINDOW_SEC = 10 * 60

export default async function handler(req, res)
{
  applyCors(req, res, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  })
  res.setHeader('Cache-Control', 'no-store')

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end()
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getUserFromBearer(req)
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' })
  }

  const limited = await enforceRateLimit(req, {
    route: 'account-delete',
    limit: 3,
    windowSec: 86400,
    key: user.id,
  })
  if (!limited.ok)
  {
    return sendRateLimited(res, limited.retryAfter)
  }

  const confirm = String(req.body?.confirm ?? '')
  if (confirm !== 'APAGAR')
  {
    return res.status(400).json({ error: 'Confirmação inválida' })
  }

  // Ação irreversível: exige login recente (senha digitada de novo, ou entrar
  // de novo pelo Google). Um token esquecido aberto não apaga a conta.
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (secondsSinceLastAuth(token) > REAUTH_WINDOW_SEC)
  {
    return res.status(403).json({ error: 'Confirme que é você entrando de novo', code: 'reauth_required' })
  }

  const admin = getSupabaseAdmin()
  if (!admin)
  {
    return res.status(503).json({ error: 'Serviço indisponível' })
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error)
  {
    console.error('[account-delete]', error.message)
    return res.status(500).json({ error: 'Não foi possível apagar a conta' })
  }

  return res.status(200).json({ ok: true })
}
