// Estimativa de esforço - fallback local (espelha backend/logic/task_estimate.py)

const MIN_ESTIMATE = 20
const MAX_ESTIMATE = 480

export function inferLocalEstimateMinutes(input)
{
  const {
    titulo = '',
    subtarefas = [],
    activityEntryCount = 0,
    descricao = '',
    prioridade = 'media',
    elapsedFocusMinutes = 0,
  } = input

  const pending = subtarefas.filter((s) => !s.concluida).length
  const total = subtarefas.length
  const desc = String(descricao || titulo).trim()

  let mins = 28
  mins += total * 14
  mins += pending * 6
  mins += activityEntryCount * 5
  mins += Math.floor(desc.length / 100) * 4

  if (total > 0)
  {
    const done = total - pending
    const ratio = done / total
    mins = Math.round(mins * (1 - ratio * 0.35))
  }

  if (prioridade === 'critica')
  {
    mins = Math.round(mins * 1.12)
  }
  else if (prioridade === 'alta')
  {
    mins = Math.round(mins * 1.06)
  }

  if (elapsedFocusMinutes > 0)
  {
    mins = Math.max(mins, elapsedFocusMinutes + 15)
  }

  return Math.max(MIN_ESTIMATE, Math.min(MAX_ESTIMATE, Math.round(mins)))
}

export function suggestExtensionDays(estimateMinutes, elapsedFocusMinutes, difficultySignal = false)
{
  if (difficultySignal)
  {
    return estimateMinutes < 90 ? 2 : 3
  }
  if (elapsedFocusMinutes >= estimateMinutes * 0.6)
  {
    return 1
  }
  return 1
}

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
          temperature: 0.35,
          maxOutputTokens: 400,
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

export async function estimateTaskEffort(payload)
{
  const localMinutes = inferLocalEstimateMinutes(payload)
  const localExtension = suggestExtensionDays(
    localMinutes,
    payload.elapsedFocusMinutes ?? 0,
    Boolean(payload.difficultySignal),
  )

  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!groqKey && !geminiKey)
  {
    return {
      estimate_minutes: localMinutes,
      extension_days: localExtension,
      reasoning: 'Estimativa local - IA indisponível no servidor.',
      confidence: 0.45,
      source: 'local',
      iaDisponivel: false,
    }
  }

  const systemInstruction = `Você é o AXEL, motor de produtividade do Simply-Life.
Analise a demanda e devolva JSON exatamente neste formato:
{
  "estimate_minutes": número inteiro entre 15 e 480,
  "extension_days": número inteiro entre 1 e 5 (dias para estender prazo se usuário travou),
  "reasoning": "1-2 frases em PT-BR explicando a estimativa",
  "confidence": número entre 0 e 1
}

Regras:
- Considere título, descrição, checklist, comentários e tempo já em foco
- Janela útil do dia: até 14 horas (840 min) para uma demanda grande
- Tarefas com mais subtarefas pendentes exigem mais tempo
- Seja conservador: subestimar frustra o usuário
- extension_days: 2-3 se dificuldade explícita; 1 se só ajuste leve
- Não invente dados que não estão no contexto`

  const userPrompt = `Contexto da demanda:
${JSON.stringify(payload, null, 2)}

Estimativa local de referência: ${localMinutes} min`

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
    const estimate = Number(parsed.estimate_minutes)
    const extension = Number(parsed.extension_days)

    return {
      estimate_minutes: Number.isFinite(estimate)
        ? Math.max(MIN_ESTIMATE, Math.min(MAX_ESTIMATE, Math.round(estimate)))
        : localMinutes,
      extension_days: Number.isFinite(extension)
        ? Math.max(1, Math.min(5, Math.round(extension)))
        : localExtension,
      reasoning: String(parsed.reasoning || 'Estimativa revisada pelo AXEL.'),
      confidence: typeof parsed.confidence === 'number'
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0.75,
      source: 'groq',
      iaDisponivel: true,
    }
  }
  catch (err)
  {
    console.error('[task-estimate]', err)
    return {
      estimate_minutes: localMinutes,
      extension_days: localExtension,
      reasoning: 'Estimativa local - falha temporária na IA.',
      confidence: 0.45,
      source: 'local',
      iaDisponivel: false,
    }
  }
}
