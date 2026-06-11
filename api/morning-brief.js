// GET/POST /api/morning-brief — resumo matinal com IA (Groq/Gemini) + fallback

function buildFallbackBrief(ctx)
{
  const {
    hojeCount = 0,
    dueToday = 0,
    overdue = 0,
    loadPercent = 0,
    criticalCount = 0,
    topTaskTitle = '',
  } = ctx

  let headline
  if (hojeCount === 0)
  {
    headline = 'Fila de execução vazia — bom momento para planejar a semana.'
  }
  else if (overdue > 0)
  {
    headline = `${overdue} atrasada(s) · ${dueToday} vencem hoje — comece pelo mais crítico.`
  }
  else if (criticalCount >= 3)
  {
    headline = `${criticalCount} críticas na fila — priorize uma de cada vez.`
  }
  else if (loadPercent >= 90)
  {
    headline = `Carga em ${loadPercent}% — considere adiar o excesso.`
  }
  else
  {
    headline = `${hojeCount} na fila · carga ${loadPercent}% — ritmo sustentável.`
  }

  const detail = topTaskTitle
    ? `Foco sugerido: ${topTaskTitle.slice(0, 56)}`
    : 'AXEL ordenou por score — comece pela primeira da fila.'

  return {
    headline,
    detail,
    criticalCount,
    loadPercent,
    hojeCount,
    source: 'local',
  }
}

async function briefWithAI(ctx, keys)
{
  const userPayload = JSON.stringify(ctx)
  const systemPrompt = `Você é o AXEL. Gere um brief matinal em PT-BR, tom de parceiro.
Responda APENAS JSON: {"headline":"1 frase direta","detail":"1 frase com foco sugerido"}
Máximo 2 frases no total. Sem emojis excessivos.`

  if (keys.groqKey)
  {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${keys.groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq ${res.status}`)
    const data = await res.json()
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}')
    return {
      headline: parsed.headline || buildFallbackBrief(ctx).headline,
      detail: parsed.detail || buildFallbackBrief(ctx).detail,
      criticalCount: ctx.criticalCount,
      loadPercent: ctx.loadPercent,
      hojeCount: ctx.hojeCount,
      source: 'ai',
    }
  }

  if (keys.geminiKey)
  {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPayload }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
        }),
      },
    )

    if (!res.ok) throw new Error(`Gemini ${res.status}`)
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const parsed = JSON.parse(raw)
    return {
      headline: parsed.headline || buildFallbackBrief(ctx).headline,
      detail: parsed.detail || buildFallbackBrief(ctx).detail,
      criticalCount: ctx.criticalCount,
      loadPercent: ctx.loadPercent,
      hojeCount: ctx.hojeCount,
      source: 'ai',
    }
  }

  return null
}

export default async function handler(req, res)
{
  if (req.method !== 'GET' && req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const data = req.method === 'POST' ? req.body : req.query

  const ctx = {
    hojeCount: Number(data.hojeCount ?? data.hoje_count ?? 0),
    dueToday: Number(data.dueToday ?? data.due_today ?? 0),
    overdue: Number(data.overdue ?? 0),
    loadPercent: Number(data.loadPercent ?? data.load_percent ?? 0),
    criticalCount: Number(data.criticalCount ?? data.critical_count ?? 0),
    topTaskTitle: String(data.topTaskTitle ?? data.top_task ?? ''),
    dailyScoreCap: Number(data.dailyScoreCap ?? 400),
    period: new Date().getHours() < 12 ? 'manhã' : new Date().getHours() < 18 ? 'tarde' : 'noite',
  }

  try
  {
    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

    if (groqKey || geminiKey)
    {
      const ai = await briefWithAI(ctx, { groqKey, geminiKey })
      if (ai) return res.status(200).json(ai)
    }

    return res.status(200).json(buildFallbackBrief(ctx))
  }
  catch (err)
  {
    console.warn('[morning-brief]', err?.message)
    return res.status(200).json(buildFallbackBrief(ctx))
  }
}
