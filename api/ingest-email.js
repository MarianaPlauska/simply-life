// POST /api/ingest-email — e-mail único ou lote com Groq estruturado

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js'
import { parseEmailWithAI, heuristicEmailParse } from './_lib/emailGroqParser.js'
import { insertTriagedTask } from './_lib/insertTriagedTask.js'

function cors(res)
{
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res)
{
  cors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  const body = req.body ?? {}
  const userId = body.user_id
  if (!userId) return res.status(400).json({ error: 'user_id obrigatório' })

  const emails = Array.isArray(body.emails)
    ? body.emails
    : [{
      sender: body.sender,
      subject: body.subject,
      body: body.body,
    }]

  const userKeywords = body.user_keywords || []
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  const results = []

  for (const email of emails)
  {
    if (!email.subject && !email.body) continue

    try
    {
      let parsed
      try
      {
        parsed = groqKey || geminiKey
          ? await parseEmailWithAI({ ...email, userKeywords }, { groqKey, geminiKey })
          : heuristicEmailParse(email)
      }
      catch (err)
      {
        console.warn('[ingest-email] IA falhou, heurística:', err?.message)
        parsed = heuristicEmailParse(email)
      }

      const scored = {
        finalScore: parsed.score,
        prioridade: parsed.prioridade,
        titulo: parsed.titulo,
        snippet: (email.body || email.subject || '').slice(0, 100),
        itemOrigem: 'gmail',
      }

      const extra = {
        data_vencimento: parsed.due_at,
        urgency_reason: parsed.rationale,
        intent_category: parsed.intent_category,
      }

      const { data: inserted, error } = await insertTriagedTask(
        supabase,
        userId,
        {
          titulo: parsed.titulo,
          body: email.body || email.subject,
          origem: 'gmail',
        },
        scored,
        extra,
      )

      if (error)
      {
        results.push({ success: false, error: error.message, subject: email.subject })
        continue
      }

      results.push({
        success: true,
        id: inserted.id,
        titulo: inserted.titulo,
        score_urgencia: inserted.score_urgencia,
        due_at: parsed.due_at,
        intent_category: parsed.intent_category,
        rationale: parsed.rationale,
        source: parsed.source,
      })
    }
    catch (err)
    {
      results.push({
        success: false,
        error: err?.message || 'Erro',
        subject: email.subject,
      })
    }
  }

  const ok = results.filter((r) => r.success).length
  return res.status(200).json({
    status: 'ingested',
    processed: results.length,
    succeeded: ok,
    results,
  })
}
