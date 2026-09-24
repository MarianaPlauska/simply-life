// POST /api/integrations/calendar/ics - busca o "endereço secreto iCal" da agenda
// (Google, Outlook, iCloud). Usado pelo app web, onde o navegador bloqueia (CORS).
// No celular o app busca direto. Grátis, sem OAuth, só leitura.
// Segurança: exige login, só aceita hosts de agenda conhecidos (sem proxy aberto),
// limite de tamanho e tempo. A URL não é gravada no servidor.

import { corsJson, getUserFromBearer } from '../../supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'

const ALLOWED_HOSTS = [
  /^calendar\.google\.com$/i,
  /^www\.google\.com$/i,
  /^outlook\.office365\.com$/i,
  /^outlook\.live\.com$/i,
  /^p\d{2}-caldav\.icloud\.com$/i,
  /^caldav\.icloud\.com$/i,
  /^calendar\.proton\.me$/i,
]
const MAX_BYTES = 3 * 1024 * 1024
const TIMEOUT_MS = 10000

export function normalizeIcsUrl(raw)
{
  let url
  try
  {
    url = new URL(String(raw || '').trim().replace(/^webcal:\/\//i, 'https://'))
  }
  catch
  {
    return null
  }
  if (url.protocol !== 'https:') return null
  if (!ALLOWED_HOSTS.some((re) => re.test(url.hostname))) return null
  if (url.hostname === 'www.google.com' && !url.pathname.startsWith('/calendar/')) return null
  return url.toString()
}

export default async function handler(req, res)
{
  corsJson(res, req)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user) return res.status(401).json({ error: 'Não autenticado' })

  const limited = await enforceRateLimit(req, { route: 'calendar-ics', limit: 20, windowSec: 3600, key: user.id })
  if (!limited.ok) return sendRateLimited(res, limited.retryAfter)

  const url = normalizeIcsUrl(req.body?.url)
  if (!url)
  {
    return res.status(400).json({ error: 'Endereço de agenda inválido. Use o "endereço secreto no formato iCal".' })
  }

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try
  {
    // redirecionamento só é seguido se o destino também for host de agenda permitido
    let target = url
    let r
    for (let hop = 0; hop < 4; hop += 1)
    {
      r = await fetch(target, { signal: ctrl.signal, redirect: 'manual', headers: { Accept: 'text/calendar' } })
      if (r.status < 300 || r.status >= 400) break
      const next = normalizeIcsUrl(new URL(r.headers.get('location') || '', target).toString())
      if (!next) return res.status(400).json({ error: 'A agenda redirecionou para um endereço não permitido.' })
      target = next
    }
    if (!r.ok) return res.status(502).json({ error: `A agenda respondeu ${r.status}. Confira se o endereço está certo.` })
    const text = await r.text()
    if (text.length > MAX_BYTES) return res.status(413).json({ error: 'Agenda grande demais para ler.' })
    if (!text.includes('BEGIN:VCALENDAR')) return res.status(422).json({ error: 'Esse endereço não é de uma agenda iCal.' })
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({ ics: text })
  }
  catch (err)
  {
    return res.status(504).json({ error: err?.name === 'AbortError' ? 'A agenda demorou para responder.' : 'Não consegui ler a agenda.' })
  }
  finally
  {
    clearTimeout(timer)
  }
}
