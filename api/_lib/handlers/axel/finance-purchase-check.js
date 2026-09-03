// POST /api/finance-purchase-check
// Axel responde "posso comprar?" com contexto real do usuário

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
      temperature: 0.35,
      max_tokens: 400,
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

export default async function handler(req, res)
{
  if (req.method !== 'POST')
  {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { context, localVerdict } = req.body || {}
  if (!context)
  {
    return res.status(400).json({ error: 'context obrigatório' })
  }

  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!groqKey && !geminiKey)
  {
    return res.status(200).json({ ...localVerdict, source: 'local', iaDisponivel: false })
  }

  const systemInstruction = `Você é o AXEL, melhor amigo financeiro no Simply-Life.
O usuário quer saber se pode fazer uma compra AGORA. Responda em JSON:
{
  "tone": "ok|caution|wait",
  "headline": "até 5 palavras",
  "detail": "2 frases em PT-BR, tom de amigo inteligente - cite valores R$ do contexto",
  "diasSugeridos": número ou null
}

Regras:
- Se folgaAposCompra < 0 → wait, explique quanto falta
- Se categoriaPctApos >= 100 → wait, nomeie a categoria
- Se compra > limiteDiarioRestante * 1.3 → caution
- Se ok, seja encorajador mas mencione folga restante
- Nunca seja genérico - use descricao, valor, categoria, cartão do contexto
- Tom humano, não robô`

  const userPrompt = `Compra proposta:
${JSON.stringify(context, null, 2)}

Análise local:
${JSON.stringify(localVerdict || {}, null, 2)}`

  try
  {
    let raw = ''
    if (groqKey)
    {
      raw = await callGroq(groqKey, systemInstruction, userPrompt)
    }
    else
    {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.35, responseMimeType: 'application/json' },
          }),
        },
      )
      const data = await response.json()
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    }

    const parsed = parseJsonFromText(raw)
    return res.status(200).json({
      tone: ['ok', 'caution', 'wait'].includes(parsed.tone) ? parsed.tone : localVerdict?.tone,
      headline: String(parsed.headline || localVerdict?.headline),
      detail: String(parsed.detail || localVerdict?.detail),
      folgaAposCompra: localVerdict?.folgaAposCompra ?? context.folgaAposCompra,
      limiteDiarioRestante: localVerdict?.limiteDiarioRestante ?? context.limiteDiarioRestante,
      categoriaNome: localVerdict?.categoriaNome ?? context.categoriaNome,
      categoriaPctApos: localVerdict?.categoriaPctApos ?? context.categoriaPctApos,
      diasSugeridos: parsed.diasSugeridos ?? localVerdict?.diasSugeridos ?? null,
      source: 'groq',
      iaDisponivel: true,
    })
  }
  catch (err)
  {
    console.error('[finance-purchase-check]', err)
    return res.status(200).json({ ...localVerdict, source: 'local', iaDisponivel: false })
  }
}
