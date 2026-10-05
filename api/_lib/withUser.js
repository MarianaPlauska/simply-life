// Portão das rotas que gastam IA ou dados do usuário:
// CORS (allowlist), login obrigatório, MFA respeitado (getUserFromBearer)
// e limite por usuário. Na dúvida, bloqueia.

import { applyCors } from './cors.js'
import { getUserFromBearer } from './supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from './rateLimit.js'

/**
 * @param {(req, res) => any} handler
 * @param {{ route: string, limit: number, windowSec?: number, methods?: string }} opts
 */
export function withUser(handler, { route, limit, windowSec = 3600, methods = 'GET, POST, OPTIONS' })
{
  return async function guarded(req, res)
  {
    applyCors(req, res, { methods, headers: 'Content-Type, Authorization' })
    res.setHeader('Cache-Control', 'no-store')
    if (req.method === 'OPTIONS') return res.status(204).end()

    const user = await getUserFromBearer(req)
    if (!user) return res.status(401).json({ error: 'Não autenticado' })

    const limited = await enforceRateLimit(req, { route, limit, windowSec, key: user.id })
    if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

    req.user = user
    return handler(req, res)
  }
}
