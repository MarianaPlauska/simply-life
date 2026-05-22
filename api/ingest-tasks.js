// POST /api/ingest-tasks — Gemini + score matemático + keywords (+50)

import { getSupabaseAdmin } from './_lib/supabaseAdmin.js';
import { fetchUserKeywords, matchUserKeywords } from './_lib/keywordBoost.js';
import { scoreFromItem } from './_lib/triageScore.js';
import { insertTriagedTask } from './_lib/insertTriagedTask.js';

const DEFAULT_AI = {
  titulo: '(sem título)',
  snippet: '',
  is_urgent: false,
  is_vip: false,
  is_bug: false,
  is_noise: false,
  acao: 'fazer',
};

async function triageWithGemini(item, apiKey)
{
  const { sender, subject, body } = item;
  const aiResult = {
    ...DEFAULT_AI,
    titulo: subject || DEFAULT_AI.titulo,
    snippet: (body || subject || '').substring(0, 100),
  };

  const systemInstruction = `Você é o motor de triagem do Simply-Life OS. Analise a mensagem e retorne APENAS um JSON puro:
{
  "titulo": "título acionável curto em PT-BR (max 80 chars)",
  "snippet": "resumo em 1 frase curta (max 100 chars)",
  "is_urgent": true/false,
  "is_vip": true/false,
  "is_bug": true/false,
  "is_noise": true/false,
  "acao": "responder|fazer|agendar|ignorar"
}`;

  const userPrompt = `De: ${sender || 'Desconhecido'}
Assunto: ${subject || '(vazio)'}
Corpo: ${(body || '').substring(0, 1500)}`;

  try
  {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 300,
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (geminiRes.ok)
    {
      const data = await geminiRes.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const parsed = JSON.parse(text.trim());
      return { ...aiResult, ...parsed };
    }
  }
  catch (aiErr)
  {
    console.warn('Gemini IA fallback:', subject, aiErr.message);
  }

  return aiResult;
}

export default async function handler(req, res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { items, user_id: userId } = req.body;
  if (!items?.length) return res.status(400).json({ error: 'items[] obrigatório (array de itens brutos)' });
  if (!userId) return res.status(400).json({ error: 'user_id obrigatório' });

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor' });

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: 'Variáveis do Supabase não configuradas' });

  try
  {
    const userKeywords = await fetchUserKeywords(supabase, userId);
    const results = [];

    for (const item of items)
    {
      const aiResult = await triageWithGemini(item, apiKey);
      const rawText = `${item.sender || ''} ${item.subject || ''} ${item.body || ''}`;
      const { boost, matched } = matchUserKeywords(rawText, userKeywords);
      const scored = scoreFromItem(
        { ...item, origem: item.origem || 'email' },
        aiResult,
        boost,
      );

      const { data: inserted, error: insertErr } = await insertTriagedTask(
        supabase,
        userId,
        { ...item, origem: item.origem || 'email' },
        scored,
      );

      if (insertErr)
      {
        results.push({ success: false, subject: item.subject, error: insertErr.message });
        continue;
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
        ai_flags: {
          is_urgent: aiResult.is_urgent,
          is_vip: aiResult.is_vip,
          is_bug: aiResult.is_bug,
          is_noise: aiResult.is_noise,
          acao: aiResult.acao,
        },
      });
    }

    return res.status(200).json({ processed: results.length, results });
  }
  catch (err)
  {
    console.error('ingest-tasks fatal:', err);
    return res.status(500).json({ error: 'Erro no motor de triagem', details: err.message });
  }
}
