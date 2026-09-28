// POST /api/axel/classify-dump - linhas soltas do Dump → tarefa/lembrete/gasto/receita/conta (Groq/Gemini)
// Corpo: { lines: string[], today: "YYYY-MM-DD", weekday: "segunda" }
// Exige JWT Supabase. Sem IA no servidor, responde source "local" e o app fica com a leitura local.

import { applyCors } from '../../cors.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { classifyDumpWithAI, sanitizeDumpRequest } from '../../dumpClassifyServer.js'

export default async function handler(req, res)
{
  applyCors(req, res, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  })
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

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
    return res.status(401).json({ error: 'Não autenticado, envie Authorization: Bearer <jwt>' })
  }

  const limited = await enforceRateLimit(req, {
    route: 'classify-dump',
    limit: 20,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok)
  {
    return sendRateLimited(res, limited.retryAfter)
  }

  const dayLimited = await enforceRateLimit(req, {
    route: 'classify-dump-day',
    limit: 120,
    windowSec: 86400,
    key: user.id,
  })
  if (!dayLimited.ok)
  {
    res.setHeader('Retry-After', String(dayLimited.retryAfter))
    return res.status(429).json({
      error: 'Cota diária de IA atingida. O Axel segue com a leitura local.',
      retry_after: dayLimited.retryAfter,
      items: [],
      source: 'local',
      iaDisponivel: false,
    })
  }

  const ctx = sanitizeDumpRequest(req.body ?? {})
  if (ctx.lines.length === 0)
  {
    return res.status(400).json({ error: 'Campo lines é obrigatório (lista de textos)' })
  }

  try
  {
    const result = await classifyDumpWithAI(ctx)
    return res.status(200).json(result)
  }
  catch (err)
  {
    console.error('[classify-dump]', err)
    return res.status(200).json({ items: [], source: 'local', iaDisponivel: false })
  }
}
