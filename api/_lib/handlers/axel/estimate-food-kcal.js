// POST /api/axel/estimate-food-kcal - calorias, proteína e açúcar estimados por item da refeição
// (Gemini com pesquisa Google → Groq). Nome da rota mantido: apps antigos leem só kcal/porcao/confianca.
// Resposta: { items: [{ kcal, proteina, acucar, porcao, confianca, fontes? }], source, iaDisponivel }
// Exige JWT Supabase. Sem IA no servidor, responde source "local" e o app usa a tabela local.

import { applyCors } from '../../cors.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { enforceRateLimit, sendRateLimited } from '../../rateLimit.js'
import { estimateFoodKcalWithAI, sanitizeFoodKcalRequest } from '../../foodKcalEstimateServer.js'

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
    route: 'estimate-food-kcal',
    limit: 20,
    windowSec: 60,
    key: user.id,
  })
  if (!limited.ok)
  {
    return sendRateLimited(res, limited.retryAfter)
  }

  const dayLimited = await enforceRateLimit(req, {
    route: 'estimate-food-kcal-day',
    limit: 120,
    windowSec: 86400,
    key: user.id,
  })
  if (!dayLimited.ok)
  {
    res.setHeader('Retry-After', String(dayLimited.retryAfter))
    return res.status(429).json({
      error: 'Cota diária de estimativas atingida. O app segue com a tabela local.',
      retry_after: dayLimited.retryAfter,
      source: 'local',
    })
  }

  const ctx = sanitizeFoodKcalRequest(req.body ?? {})
  if (!ctx.items.length)
  {
    return res.status(400).json({ error: 'Campo items é obrigatório' })
  }

  try
  {
    const result = await estimateFoodKcalWithAI(ctx)
    return res.status(200).json(result)
  }
  catch (err)
  {
    console.error('[estimate-food-kcal]', err)
    return res.status(200).json({ items: [], source: 'local', iaDisponivel: false })
  }
}
