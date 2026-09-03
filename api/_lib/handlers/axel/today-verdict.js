// POST /api/axel/today-verdict
// AXEL - "posso fazer isso hoje?" com IA opcional (Groq/Gemini)

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
      max_tokens: 500,
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
  if (!context?.question)
  {
    return res.status(400).json({ error: 'context.question obrigatório' })
  }

  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!groqKey && !geminiKey)
  {
    return res.status(200).json({ ...localVerdict, source: 'local', iaDisponivel: false })
  }

  const systemInstruction = `Você é o AXEL, melhor amigo no Simply-Life.
O usuário pergunta se pode fazer algo HOJE. Responda em JSON:
{
  "tone": "ok|caution|wait",
  "headline": "até 6 palavras",
  "summary": "2 frases em PT-BR, tom de amigo - cite dinheiro/energia/prazo do contexto",
  "suggestedAction": "1 frase prática"
}

Regras:
- Use o veredito local como base - refine tom e frases, não contradiga folga negativa
- Cite valores R$ quando relevante
- Se notas recentes (diário/anotações) pedem cautela, mencione
- Tom humano Finch, não robô`

  const userPrompt = `Pergunta: ${context.question}

Contexto:
${JSON.stringify(context, null, 2)}

Veredito local:
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
      summary: String(parsed.summary || localVerdict?.summary),
      suggestedAction: String(parsed.suggestedAction || localVerdict?.suggestedAction || ''),
      intent: localVerdict?.intent,
      bullets: localVerdict?.bullets,
      rulesApplied: localVerdict?.rulesApplied,
      source: 'groq',
      iaDisponivel: true,
    })
  }
  catch (err)
  {
    console.error('[today-verdict]', err)
    return res.status(200).json({ ...localVerdict, source: 'local', iaDisponivel: false })
  }
}
