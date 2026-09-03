// POST /api/ingest-email - e-mail único ou lote com Groq estruturado
// Exige JWT Supabase - user_id vem do token, nunca do body

import { getSupabaseAdmin } from '../../supabaseAdmin.js'
import { getUserFromBearer } from '../../supabaseUser.js'
import { applyCors } from '../../cors.js'
import { parseEmailWithAI, heuristicEmailParse } from '../../emailGroqParser.js'
import { insertTriagedTask } from '../../insertTriagedTask.js'

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
    return res.status(401).json({ error: 'Não autenticado - envie Authorization: Bearer <jwt>' })
  }

  const supabase = getSupabaseAdmin()
  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' })

  const userId = user.id
  const body = req.body ?? {}

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
        itemOrigem: 'email',
      }

      const extra = {
        data_vencimento: parsed.due_at,
        urgency_reason: parsed.rationale,
        intent_category: parsed.intent_category,
        score_reason: 'Ingestão por e-mail',
        external_ref: email.id || email.message_id || null,
      }

      const { data: inserted, error } = await insertTriagedTask(
        supabase,
        userId,
        {
          titulo: parsed.titulo,
          body: email.body || email.subject,
          origem: 'email',
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
