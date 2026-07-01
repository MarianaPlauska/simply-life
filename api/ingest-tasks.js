// POST /api/ingest-tasks — triagem com score matemático + keywords
// Exige JWT Supabase — user_id vem do token, nunca do body

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { getUserFromBearer } from './_lib/supabaseUser.js'
import { applyCors } from './_lib/cors.js'
import { fetchUserKeywords, matchUserKeywords } from './_lib/keywordBoost.js'
import { scoreFromItem } from './_lib/triageScore.js'
import { insertTriagedTask } from './_lib/insertTriagedTask.js'

const URGENCY_WORDS = ['urgente', 'urgent', 'asap', 'critico', 'crítico', 'p0', 'hotfix']

function defaultAi(item)
{
  const subject = item.subject || ''
  const body = item.body || ''
  const text = `${subject} ${body}`.toLowerCase()

  return {
    titulo: subject || '(sem título)',
    snippet: (body || subject || '').substring(0, 100),
    is_urgent: URGENCY_WORDS.some((kw) => text.includes(kw)),
    is_vip: false,
    is_bug: text.includes('bug') || text.includes('erro'),
    is_noise: false,
    acao: 'fazer',
  }
}

async function triageWithGemini(item, apiKey)
{
  if (!apiKey) return defaultAi(item)

  try
  {
    const userPrompt = `De: ${item.sender || 'Desconhecido'}\nAssunto: ${item.subject || '(vazio)'}\nCorpo: ${(item.body || '').substring(0, 1500)}`
    const sys = `Retorne APENAS JSON: {"titulo","snippet","is_urgent","is_vip","is_bug","is_noise","acao"}.`

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: sys }] },
          generationConfig: { temperature: 0.1, maxOutputTokens: 300, responseMimeType: 'application/json' },
        }),
      },
    )

    if (!res.ok) return defaultAi(item)

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    return { ...defaultAi(item), ...JSON.parse(text.trim()) }
  }
  catch
  {
    return defaultAi(item)
  }
}

export default async function handler(req, res)
{
  applyCors(req, res, {
    methods: 'POST, OPTIONS',
    headers: 'Content-Type, Authorization',
  })
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const user = await getUserFromBearer(req)
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado — envie Authorization: Bearer <jwt>' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase)
  {
    return res.status(500).json({
      error: 'Supabase nao configurado',
      hint: 'Defina SUPABASE_SERVICE_ROLE_KEY no Vercel (Settings > Environment Variables)',
    })
  }

  const userId = user.id
  const { items } = req.body || {}
  if (!items?.length) return res.status(400).json({ error: 'items[] obrigatorio' })

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  try
  {
    const userKeywords = await fetchUserKeywords(supabase, userId)
    const results = []

    for (const item of items)
    {
      const aiResult = await triageWithGemini(item, apiKey)
      const rawText = `${item.sender || ''} ${item.subject || ''} ${item.body || ''}`
      const { boost, matched } = matchUserKeywords(rawText, userKeywords)
      const scored = scoreFromItem({ ...item, origem: item.origem || 'email' }, aiResult, boost)

      const { data: inserted, error: insertErr } = await insertTriagedTask(
        supabase,
        userId,
        { ...item, origem: item.origem || 'email' },
        scored,
      )

      if (insertErr)
      {
        results.push({ success: false, subject: item.subject, error: insertErr.message })
        continue
      }

      results.push({
        success: true,
        id: inserted.id,
        titulo: inserted.titulo,
        score_urgencia: inserted.score_urgencia,
        prioridade: inserted.prioridade,
        breakdown: scored.breakdown,
        keyword_boost: boost,
        keywords_matched: matched,
        ai_used: Boolean(apiKey),
      })
    }

    return res.status(200).json({ processed: results.length, results })
  }
  catch (err)
  {
    console.error('ingest-tasks fatal:', err)
    return res.status(500).json({
      error: 'Erro no motor de triagem',
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 3).join(' | '),
    })
  }
}
