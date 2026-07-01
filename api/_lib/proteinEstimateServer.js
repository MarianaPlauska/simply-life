// Estimativa de proteína — Groq/Gemini no servidor + fallback local

import { estimateProteinLocal, estimateKcalLocal } from './proteinEstimateLocal.js'

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
      temperature: 0.2,
      max_tokens: 350,
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
          temperature: 0.2,
          maxOutputTokens: 350,
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

export async function estimateProteinFromMeal({ texto, refeicao })
{
  const local = estimateProteinLocal(texto, refeicao)
  const groqKey = process.env.GROQ_API_KEY
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

  if (!groqKey && !geminiKey)
  {
    return {
      gramas: local.gramas,
      kcal: estimateKcalLocal(texto, refeicao, local.gramas),
      matches: local.matches,
      confianca: local.confianca,
      reasoning: 'Estimativa local — sem chave de IA no servidor.',
      source: 'local',
      iaDisponivel: false,
    }
  }

  const systemInstruction = `Você é nutricionista do Simply-Life (AXEL). Estime proteína e calorias de uma refeição descrita em PT-BR.
Retorne APENAS JSON:
{
  "gramas": número inteiro (5-120),
  "kcal": número inteiro (80-1200),
  "matches": [{"label": "item detectado", "gramas": número}],
  "confianca": "alta" | "media" | "baixa",
  "reasoning": "1 frase curta em PT-BR"
}

Regras:
- Some proteína de todos os alimentos mencionados
- Porções típicas BR: frango 150g ≈ 46g, carne 150g ≈ 42g, ovo ≈ 6g cada, feijão concha ≈ 12g
- Se o usuário informar gramas explícitas ("30g"), use esse valor
- Seja conservador; prefira subestimar levemente a inventar alimentos não citados
- refeicao contextual: cafe (menor), almoco/jantar (maior), lanche (médio)`

  const userPrompt = `Refeição: ${refeicao || 'almoco'}
Descrição: ${String(texto || '').slice(0, 800)}`

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
    const gramas = Math.max(0, Math.min(200, Math.round(Number(parsed.gramas) || 0)))
    if (gramas <= 0)
    {
      throw new Error('IA retornou gramas inválidas')
    }

    const kcal = Math.max(0, Math.min(2500, Math.round(Number(parsed.kcal) || estimateKcalLocal(texto, refeicao, gramas))))

    const matches = Array.isArray(parsed.matches)
      ? parsed.matches.map((m) => ({
        label: String(m.label || 'item'),
        gramas: Math.max(0, Math.round(Number(m.gramas) || 0)),
      })).filter((m) => m.gramas > 0)
      : local.matches

    const confianca = ['alta', 'media', 'baixa'].includes(parsed.confianca)
      ? parsed.confianca
      : local.confianca

    return {
      gramas,
      kcal,
      matches: matches.length ? matches : local.matches,
      confianca,
      reasoning: String(parsed.reasoning || 'Estimativa via IA.'),
      source: 'ai',
      iaDisponivel: true,
    }
  }
  catch (err)
  {
    console.warn('[protein-estimate] fallback local:', err?.message)
    return {
      gramas: local.gramas,
      kcal: estimateKcalLocal(texto, refeicao, local.gramas),
      matches: local.matches,
      confianca: local.confianca,
      reasoning: 'IA indisponível — usei tabela local de alimentos.',
      source: 'local',
      iaDisponivel: Boolean(groqKey || geminiKey),
    }
  }
}
