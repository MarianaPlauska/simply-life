// POST /api/finance-coach
// Conselho financeiro personalizado via Groq/Gemini com contexto dos gastos do usuário

function parseJsonFromText(text)
{
  const trimmed = String(text || '').trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)
  const raw = fenced ? fenced[1].trim() : trimmed
  return JSON.parse(raw)
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
      temperature: 0.4,
      max_tokens: 600,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok)
  {
    const err = await res.text()
    throw new Error(`Groq HTTP ${res.status}: ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
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
          temperature: 0.4,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok)
  {
    const err = await response.text()
    throw new Error(`Gemini HTTP ${response.status}: ${err.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export default async function handler(req, res)
{
  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { context, localAdvice, aiTone } = req.body || {}

  if (!context)
  {
    return res.status(400).json({ error: 'context obrigatório' })
  }

  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!groqKey && !geminiKey)
  {
    return res.status(200).json({
      ...localAdvice,
      source: 'local',
      iaDisponivel: false,
    })
  }

  const toneLine = aiTone
    ? `\nTom de voz obrigatório: ${aiTone}`
    : '';

  const systemInstruction = `Você é o AXEL, o melhor amigo financeiro do usuário no Simply-Life.
Analise os dados reais de gastos e devolva um JSON exatamente neste formato:
{
  "headline": "título curto em PT-BR (máx 6 palavras)",
  "detail": "2 frases empáticas e diretas em PT-BR, citando valores em R$ do contexto",
  "tone": "ok|caution|urgent",
  "limiteDiarioSugerido": número ou null,
  "limitSuggestions": [
    { "categoriaNome": "nome exato da categoria", "valorSugerido": número, "motivo": "frase curta" }
  ]
}

Regras:
- Seja como um amigo que se importa, não um robô frio
- Use números concretos do contexto (folga, ritmo diário, categorias)
- Se folga baixa, diga quanto evitar gastar por dia
- Se categoria estourou limite, nomeie e peça contenção
- limitSuggestions: no máximo 3 categorias sem limite ou com gasto acima da média
- valorSugerido: arredondado, realista (baseado em média ou gasto atual)
- Nunca invente categorias que não estão no contexto${toneLine}`

  const userPrompt = `Contexto financeiro do usuário (dados reais):
${JSON.stringify(context, null, 2)}

Conselho local de referência (pode melhorar, não copiar):
${JSON.stringify(localAdvice || {}, null, 2)}`

  try
  {
    let raw = ''

    if (groqKey)
    {
      raw = await callGroq(groqKey, systemInstruction, userPrompt)
    }
    else
    {
      raw = await callGemini(geminiKey, systemInstruction, userPrompt)
    }

    const parsed = parseJsonFromText(raw)

    return res.status(200).json({
      headline: String(parsed.headline || localAdvice?.headline || 'Olá'),
      detail: String(parsed.detail || localAdvice?.detail || ''),
      tone: ['ok', 'caution', 'urgent'].includes(parsed.tone) ? parsed.tone : 'ok',
      limiteDiarioSugerido: typeof parsed.limiteDiarioSugerido === 'number'
        ? parsed.limiteDiarioSugerido
        : localAdvice?.limiteDiarioSugerido ?? null,
      limitSuggestions: Array.isArray(parsed.limitSuggestions)
        ? parsed.limitSuggestions.slice(0, 3).map((s) => ({
          categoriaNome: String(s.categoriaNome || ''),
          valorSugerido: Number(s.valorSugerido) || 0,
          motivo: String(s.motivo || ''),
        }))
        : localAdvice?.limitSuggestions || [],
      source: 'groq',
      iaDisponivel: true,
    })
  }
  catch (err)
  {
    console.error('[finance-coach]', err)
    return res.status(200).json({
      ...localAdvice,
      source: 'local',
      iaDisponivel: false,
    })
  }
}
