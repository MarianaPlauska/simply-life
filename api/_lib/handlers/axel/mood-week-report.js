// POST /api/axel/mood-week-report — relatório semanal de humor com IA (Groq/Gemini)

import { getSupabaseAdmin } from '../../supabaseAdmin.js';
import { getUserFromBearer, corsJson } from '../../supabaseUser.js';

function parseJsonFromText(text)
{
  const trimmed = String(text || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

function buildLocalResponse(body)
{
  const stats = body.stats || {};
  const localThemes = Array.isArray(body.localThemes) ? body.localThemes : [];
  const topMoods = Array.isArray(stats.topMoods) ? stats.topMoods : [];
  const topLine = topMoods.map((m) => `${m.label} (${m.pct}%)`).join(' e ');
  const summary = topLine
    ? `Na semana, ${topLine} foram os humores mais frequentes.`
    : 'Semana com registros de humor.';

  const themes = localThemes.slice(0, 3).map((t) => ({
    label: String(t.theme || ''),
    count: Number(t.count) || 1,
    examples: [String(t.theme || '')],
  }));

  let careNote = 'Registro pessoal — não é diagnóstico. Cuide-se no seu ritmo.';
  const alertLevel = ['none', 'watch', 'concern'].includes(stats.alertLevel)
    ? stats.alertLevel
    : 'none';

  if (alertLevel === 'concern')
  {
    careNote = 'Vários dias difíceis apareceram. Se continuar pesado, converse com alguém de confiança ou busque apoio (CVV 188).';
  }
  else if (alertLevel === 'watch')
  {
    careNote = 'Alguns dias foram mais pesados. Observe o que ajuda — sem se cobrar.';
  }

  return {
    summary,
    themes,
    careNote,
    alertLevel,
    source: 'local',
    iaDisponivel: false,
  };
}

function normalizeAiResponse(parsed, fallback)
{
  const alertLevel = ['none', 'watch', 'concern'].includes(parsed.alertLevel)
    ? parsed.alertLevel
    : fallback.alertLevel;

  const themes = Array.isArray(parsed.themes)
    ? parsed.themes.slice(0, 4).map((t) => ({
      label: String(t.label || t.theme || '').slice(0, 80),
      count: Math.max(1, Number(t.count) || 1),
      examples: Array.isArray(t.examples)
        ? t.examples.map((e) => String(e).slice(0, 120)).slice(0, 2)
        : [],
    })).filter((t) => t.label)
    : fallback.themes;

  return {
    summary: String(parsed.summary || fallback.summary).slice(0, 400),
    themes: themes.length ? themes : fallback.themes,
    careNote: String(parsed.careNote || fallback.careNote).slice(0, 320),
    alertLevel,
  };
}

async function callGroq(apiKey, systemInstruction, userPrompt)
{
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.35,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok)
  {
    const err = await res.text();
    throw new Error(`Groq HTTP ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGemini(apiKey, systemInstruction, userPrompt)
{
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.35,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok)
  {
    const err = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export default async function handler(req, res)
{
  corsJson(res, req);

  if (req.method === 'OPTIONS')
  {
    return res.status(204).end();
  }

  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await getUserFromBearer(req);
  if (!user)
  {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  const body = req.body || {};
  const weekStart = String(body.weekStart || '').slice(0, 10);
  const weekEnd = String(body.weekEnd || '').slice(0, 10);

  if (!weekStart || !weekEnd || !body.stats)
  {
    return res.status(400).json({ error: 'weekStart, weekEnd e stats são obrigatórios' });
  }

  const localFallback = buildLocalResponse(body);
  const admin = getSupabaseAdmin();

  if (!admin)
  {
    return res.status(200).json(localFallback);
  }

  const { data: prefsRow } = await admin
    .from('user_workspace_prefs')
    .select('prefs')
    .eq('user_id', user.id)
    .maybeSingle();

  const aiEnabled = prefsRow?.prefs?.ai_coach_enabled !== false;

  if (!aiEnabled)
  {
    return res.status(200).json(localFallback);
  }

  if (!body.forceRefresh)
  {
    try
    {
      const { data: cached } = await admin
        .from('mood_week_reports')
        .select('payload, source')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (cached?.payload)
      {
        return res.status(200).json({
          ...cached.payload,
          source: 'cache',
          iaDisponivel: true,
        });
      }
    }
    catch (cacheErr)
    {
      console.warn('[mood-week-report] cache read', cacheErr?.message);
    }
  }

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!groqKey && !geminiKey)
  {
    return res.status(200).json(localFallback);
  }

  const systemInstruction = `Você é o AXEL no Simply-Life. Analise o humor da semana do usuário.
Responda APENAS JSON neste formato:
{
  "summary": "2 frases em PT-BR sobre a semana (cite percentuais do contexto)",
  "themes": [
    { "label": "tema curto (ex: Trabalho, Sono)", "count": número, "examples": ["trecho real da nota"] }
  ],
  "careNote": "1 frase empática de cuidado, sem culpa",
  "alertLevel": "none|watch|concern"
}

Regras:
- NUNCA diagnostique (ansiedade, depressão, TDAH, etc.)
- Use só temas suportados pelas notas enviadas — não invente
- themes: máximo 3; count deve refletir repetições plausíveis
- Se terriblePct >= 40 ou vários Péssimo: alertLevel concern e mencione apoio (CVV 188) em careNote, sem alarmismo
- Se goalContext existir, pode citar em 1 frase (meta + humor difícil no mesmo período)
- Tom de parceiro que convida, nunca cobra`;

  const userPrompt = `Dados da semana (${weekStart} a ${weekEnd}):
${JSON.stringify({
    stats: body.stats,
    notes: Array.isArray(body.notes) ? body.notes.slice(0, 24) : [],
    localThemes: body.localThemes || [],
    goalContext: body.goalContext || null,
  }, null, 2)}`;

  try
  {
    let raw = '';
    let provider = 'groq';

    if (groqKey)
    {
      raw = await callGroq(groqKey, systemInstruction, userPrompt);
    }
    else
    {
      raw = await callGemini(geminiKey, systemInstruction, userPrompt);
      provider = 'gemini';
    }

    const parsed = parseJsonFromText(raw);
    const normalized = normalizeAiResponse(parsed, localFallback);
    const result = {
      ...normalized,
      source: provider,
      iaDisponivel: true,
    };

    try
    {
      await admin.from('mood_week_reports').upsert({
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        payload: normalized,
        source: provider,
      });
    }
    catch (cacheErr)
    {
      console.warn('[mood-week-report] cache write', cacheErr?.message);
    }

    return res.status(200).json(result);
  }
  catch (err)
  {
    console.error('[mood-week-report]', err);
    return res.status(200).json(localFallback);
  }
}
