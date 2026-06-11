// Parser estruturado de e-mail — Groq/Gemini (score, prazo, intenção)

/**
 * @param {{ sender?: string, subject?: string, body?: string, userKeywords?: string[] }} email
 * @param {{ groqKey?: string, geminiKey?: string }} keys
 */
export async function parseEmailWithAI(email, keys = {})
{
  const keywords = (email.userKeywords || []).join(', ')
  const userPayload = JSON.stringify({
    sender: email.sender || 'desconhecido',
    subject: email.subject || '',
    body: (email.body || '').slice(0, 1200),
    user_keywords: keywords || 'nenhuma',
  })

  const systemPrompt = `Você é o AXEL — triagem de e-mails para Kanban pessoal.
Responda APENAS JSON válido:
{
  "titulo": "string curta para a tarefa",
  "score": número 0-100,
  "prioridade": "baixa|media|alta|critica",
  "intent_category": "execucao|alinhamento|bloqueio",
  "due_at": "ISO8601 ou null se não houver prazo inferível",
  "rationale": "1 frase em PT-BR explicando a decisão",
  "keywords_detectadas": ["termo1"]
}

Regras:
- FYI/newsletter → alinhamento, score baixo, due_at null
- Bloqueio/impedimento → bloqueio, score alto
- Prazo explícito no texto → due_at correspondente
- Remetente crítico ou [URGENTE] → score alto`

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
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPayload },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
    const data = await res.json()
    return normalizeEmailParse(JSON.parse(data.choices?.[0]?.message?.content || '{}'), email)
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
          generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        }),
      },
    )

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    return normalizeEmailParse(JSON.parse(raw), email)
  }

  return heuristicEmailParse(email)
}

function normalizeEmailParse(parsed, email)
{
  const score = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 0)))
  let prioridade = parsed.prioridade || 'media'
  if (!['baixa', 'media', 'alta', 'critica'].includes(prioridade))
  {
    prioridade = score >= 80 ? 'critica' : score >= 55 ? 'alta' : score < 30 ? 'baixa' : 'media'
  }

  let dueAt = parsed.due_at || null
  if (dueAt)
  {
    const d = new Date(dueAt)
    dueAt = Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  const intent = ['execucao', 'alinhamento', 'bloqueio'].includes(parsed.intent_category)
    ? parsed.intent_category
    : 'execucao'

  return {
    titulo: (parsed.titulo || email.subject || '(sem título)').slice(0, 200),
    score,
    prioridade,
    intent_category: intent,
    due_at: dueAt,
    rationale: parsed.rationale || 'Triagem automática',
    keywords_detectadas: Array.isArray(parsed.keywords_detectadas) ? parsed.keywords_detectadas : [],
    source: 'ai',
  }
}

/** Fallback sem IA — heurística local */
export function heuristicEmailParse(email)
{
  const subject = email.subject || ''
  const body = email.body || ''
  const text = `${subject} ${body}`.toLowerCase()
  let score = 40

  if (/urgente|asap|bloqueio|impedimento|crítico|critico/.test(text)) score += 35
  if (/fyi|para conhecimento|newsletter/.test(text)) score = Math.max(5, score - 40)

  let dueAt = null
  if (/hoje|today/.test(text))
  {
    const d = new Date()
    d.setHours(17, 0, 0, 0)
    dueAt = d.toISOString()
  }
  else if (/amanhã|amanha|tomorrow/.test(text))
  {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(17, 0, 0, 0)
    dueAt = d.toISOString()
  }

  return {
    titulo: subject || body.slice(0, 80) || '(sem título)',
    score: Math.min(100, score),
    prioridade: score >= 80 ? 'critica' : score >= 55 ? 'alta' : 'media',
    intent_category: /bloqueio|blocked/.test(text) ? 'bloqueio' : /fyi|conhecimento/.test(text) ? 'alinhamento' : 'execucao',
    due_at: dueAt,
    rationale: 'Triagem heurística (IA indisponível)',
    keywords_detectadas: [],
    source: 'mock',
  }
}
