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
    headline = 'Como você está hoje? A fila de Hoje está quieta — dá para respirar.'
  }
  else if (overdue > 0)
  {
    headline = 'Tem item que passou da data. Quando fizer sentido, dá uma olhada.'
  }
  else if (loadPercent >= 90)
  {
    headline = 'O dia está cheio. A gente olha o essencial primeiro, sem pressa.'
  }
  else if (hojeCount === 1)
  {
    headline = 'Tem uma coisa em Hoje, no seu ritmo.'
  }
  else
  {
    headline = `Tem ${hojeCount} em Hoje, no seu ritmo.`
  }

  const ritmo = loadPercent >= 90 ? 'dia cheio' : loadPercent >= 80 ? 'ritmo justo' : 'ritmo ok'
  const loadLine = hojeCount === 0
    ? `Nada na fila de Hoje · carga ${loadPercent}%`
    : `${hojeCount === 1 ? '1 coisa em Hoje' : `${hojeCount} em Hoje`} · carga ${loadPercent}% · ${ritmo}`

  const detail = topTaskTitle
    ? `Se couber, começa por: ${topTaskTitle.slice(0, 56)}`
    : 'Quando fizer sentido, dá uma olhada no que está em Hoje.'

  return {
    headline,
    loadLine,
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
  const systemPrompt = `Você é o AXEL. Gere um brief matinal em PT-BR, tom de parceiro que convida, nunca cobra.
Responda APENAS JSON: {"headline":"1 frase de conversa (como você está / no seu ritmo)","detail":"1 frase com foco sugerido, sem culpa"}
Carga percentual NÃO entra na headline. Sem emojis. Sem "atrasado", "crítico" ou "você precisa".`

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
      loadLine: buildFallbackBrief(ctx).loadLine,
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
      loadLine: buildFallbackBrief(ctx).loadLine,
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
