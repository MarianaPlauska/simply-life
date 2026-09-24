// POST /api/axel/parse-task-prompt - texto livre → tarefas estruturadas (Groq/Gemini)
// Exige JWT Supabase. Sem IA no servidor, responde source "local" e o app usa o parser local.

import { applyCors } from '../../cors.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { parseTaskPromptWithAI, sanitizeTaskPromptRequest } from '../../taskPromptServer.js'

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
    return res.status(401).json({ error: 'Não autenticado - envie Authorization: Bearer <jwt>' })
  }

  const limited = await enforceRateLimit(req, {
    route: 'parse-task-prompt',
    limit: 20,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok)
  {
    return sendRateLimited(res, limited.retryAfter)
  }

  const dayLimited = await enforceRateLimit(req, {
    route: 'parse-task-prompt-day',
    limit: 80,
    windowSec: 86400,
    key: user.id,
  })
  if (!dayLimited.ok)
  {
    res.setHeader('Retry-After', String(dayLimited.retryAfter))
    return res.status(429).json({
      error: 'Cota diária de IA atingida. O Axel segue com a leitura local.',
      retry_after: dayLimited.retryAfter,
      source: 'local',
    })
  }

  const ctx = sanitizeTaskPromptRequest(req.body ?? {})
  if (ctx.prompt.length < 2)
  {
    return res.status(400).json({ error: 'Campo prompt é obrigatório' })
  }

  try
  {
    const result = await parseTaskPromptWithAI(ctx)
    return res.status(200).json(result)
  }
  catch (err)
  {
    console.error('[parse-task-prompt]', err)
    return res.status(200).json({ tasks: [], perguntas: [], source: 'local', iaDisponivel: false })
  }
}
