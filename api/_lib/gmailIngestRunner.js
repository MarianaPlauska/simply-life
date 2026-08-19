// Processa lote de e-mails — Groq + insert + log AXEL

import { parseEmailWithAI, heuristicEmailParse } from './emailGroqParser.js'
import { insertTriagedTask } from './insertTriagedTask.js'
import { markEmailAsRead } from './gmailClient.js'

function messageKey(email)
{
  return String(email.message_id || email.id || '').trim()
}

async function alreadyIngested(supabase, userId, key)
{
  if (!key) return false
  const { data, error } = await supabase
    .from('email_ingest_dedup')
    .select('message_id')
    .eq('user_id', userId)
    .eq('message_id', key)
    .maybeSingle()
  if (error) return false
  return Boolean(data)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function ingestGmailBatch(supabase, userId, emails, accessToken, userKeywords = [])
{
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
  let succeeded = 0

  for (const email of emails)
  {
    const key = messageKey(email)
    if (key && await alreadyIngested(supabase, userId, key))
    {
      continue
    }

    let parsed
    try
    {
      parsed = groqKey || geminiKey
        ? await parseEmailWithAI(
          {
            sender: email.sender,
            subject: email.subject,
            body: email.body,
            userKeywords,
          },
          { groqKey, geminiKey },
        )
        : heuristicEmailParse({
          sender: email.sender,
          subject: email.subject,
          body: email.body,
        })
    }
    catch
    {
      parsed = heuristicEmailParse({
        sender: email.sender,
        subject: email.subject,
        body: email.body,
      })
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
      external_ref: key || null,
    }

    const { data: inserted, error, duplicate } = await insertTriagedTask(
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

    if (!error && inserted?.id)
    {
      succeeded += 1
      if (key)
      {
        await supabase.from('email_ingest_dedup').upsert({
          user_id: userId,
          message_id: key,
          tarefa_id: inserted.id,
        })
      }
      if (!duplicate)
      {
        await supabase.from('axel_decision_events').insert({
          user_id: userId,
          task_id: inserted.id,
          kind: 'email_ingest',
          rationale: 'Ingestão por e-mail',
          score: scored.finalScore,
          horizon: scored.finalScore >= 70 ? 'hoje' : (scored.finalScore >= 40 ? 'semana' : 'backlog'),
        })
      }
    }

    if (accessToken && email.id)
    {
      await markEmailAsRead(accessToken, email.id)
    }
  }

  return { processed: emails.length, succeeded }
}
