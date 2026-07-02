// POST /api/estimate-protein — estimativa de proteína (Groq/Gemini + fallback local)
// Exige JWT Supabase

import { applyCors } from '../../cors.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { estimateProteinFromMeal } from '../../proteinEstimateServer.js'

const REFEICOES = new Set(['cafe', 'almoco', 'jantar', 'lanche'])

export default async function handler(req, res)
{
  applyCors(req, res, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  })

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
    return res.status(401).json({ error: 'Não autenticado — envie Authorization: Bearer <jwt>' })
  }

  const { texto, refeicao } = req.body ?? {}
  if (!texto || !String(texto).trim())
  {
    return res.status(400).json({ error: 'Campo texto é obrigatório' })
  }

  const ref = REFEICOES.has(refeicao) ? refeicao : 'almoco'

  try
  {
    const result = await estimateProteinFromMeal({ texto: String(texto), refeicao: ref })
    return res.status(200).json(result)
  }
  catch (err)
  {
    console.error('[estimate-protein]', err)
    return res.status(500).json({ error: err?.message || 'Falha na estimativa' })
  }
}
