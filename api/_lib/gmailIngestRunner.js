// Processa lote de e-mails — Groq + insert Supabase

import { parseEmailWithAI, heuristicEmailParse } from './emailGroqParser.js';
import { insertTriagedTask } from './insertTriagedTask.js';
import { markEmailAsRead } from './gmailClient.js';

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function ingestGmailBatch(supabase, userId, emails, accessToken, userKeywords = [])
{
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let succeeded = 0;

  for (const email of emails)
  {
    let parsed;
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
        });
    }
    catch
    {
      parsed = heuristicEmailParse({
        sender: email.sender,
        subject: email.subject,
        body: email.body,
      });
    }

    const scored = {
      finalScore: parsed.score,
      prioridade: parsed.prioridade,
      titulo: parsed.titulo,
      snippet: (email.body || email.subject || '').slice(0, 100),
      itemOrigem: 'gmail',
    };

    const extra = {
      data_vencimento: parsed.due_at,
      urgency_reason: parsed.rationale,
      intent_category: parsed.intent_category,
    };

    const { error } = await insertTriagedTask(
      supabase,
      userId,
      {
        titulo: parsed.titulo,
        body: email.body || email.subject,
        origem: 'gmail',
      },
      scored,
      extra,
    );

    if (!error)
    {
      succeeded += 1;
    }

    if (accessToken && email.id)
    {
      await markEmailAsRead(accessToken, email.id);
    }
  }

  return { processed: emails.length, succeeded };
}
