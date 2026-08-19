// Rate limit em Postgres — sem Redis pago, funciona entre instâncias serverless

import { getSupabaseAdmin } from './supabaseAdmin.js'

function clientKeyFromRequest(req)
{
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim())
  {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || req.headers['x-real-ip'] || 'unknown'
}

/**
 * @returns {{ ok: true } | { ok: false, status: number, retryAfter: number }}
 */
export async function enforceRateLimit(req, { route, limit, windowSec = 60, key } = {})
{
  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return { ok: true }
  }

  const clientKey = key || clientKeyFromRequest(req)
  const windowStart = new Date(Date.now() - windowSec * 1000).toISOString()

  const { count, error: countErr } = await supabase
    .from('api_rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('route', route)
    .eq('client_key', clientKey)
    .gte('created_at', windowStart)

  if (countErr)
  {
    console.warn('[rateLimit] count falhou, fail-open:', countErr.message)
    return { ok: true }
  }

  if ((count ?? 0) >= limit)
  {
    return { ok: false, status: 429, retryAfter: windowSec }
  }

  const { error: insertErr } = await supabase
    .from('api_rate_limits')
    .insert({ route, client_key: clientKey })

  if (insertErr)
  {
    console.warn('[rateLimit] insert falhou, fail-open:', insertErr.message)
  }

  if (Math.random() < 0.05)
  {
    const pruneBefore = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    void supabase.from('api_rate_limits').delete().lt('created_at', pruneBefore)
  }

  return { ok: true }
}

export function sendRateLimited(res, retryAfter = 60)
{
  res.setHeader('Retry-After', String(retryAfter))
  return res.status(429).json({
    error: 'Muitas requisições. Tente de novo em instantes.',
    retry_after: retryAfter,
  })
}
