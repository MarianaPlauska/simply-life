// GET /api/integrations/google/calendar-events?days=14 - eventos da agenda principal
// usando o login Google que o app já tem (escopo calendar.readonly já é pedido).
// API do Google Calendar é gratuita. Devolve só os campos que o app usa.

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { corsJson, getUserFromBearer } from '../../supabaseUser.js'
import { resolveGoogleAccessToken } from '../../googleOAuth.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, { route: 'google-calendar', limit: 30, windowSec: 3600, key: user.id })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(200).json({ connected: false, items: [] })

  let token
  try
  {
    token = await resolveGoogleAccessToken(supabase, user.id)
  }
  catch
  {
    token = null
  }
  if (!token) return res.status(200).json({ connected: false, items: [] })

  const days = Math.min(31, Math.max(1, Number(req.query.days) || 14))
  const timeMin = new Date(Date.now() - 86400000)
  const timeMax = new Date(Date.now() + days * 86400000)
  const params = new URLSearchParams({
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  })

  const r = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (r.status === 401 || r.status === 403)
  {
    // conta conectada antes do escopo de agenda, ou permissão negada
    return res.status(200).json({ connected: true, scope: false, items: [] })
  }
  if (!r.ok) return res.status(502).json({ error: `Google Calendar respondeu ${r.status}` })

  const data = await r.json()
  const items = (data.items || [])
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      id: String(e.id),
      summary: String(e.summary || '(sem título)').slice(0, 200),
      location: e.location ? String(e.location).slice(0, 200) : null,
      start: e.start || null,
      end: e.end || null,
      transparency: e.transparency || 'opaque',
    }))
  res.setHeader('Cache-Control', 'no-store')
  return res.status(200).json({ connected: true, scope: true, items })
}
