// Motor de urgência AXEL — triagem antes de persistir (Motor de Relevância)

import { calculateUrgency } from './relevanceEngine.js';

const PROJECT_TAGS = ['SST', 'FINALLY', 'HUB', 'CORE'];

/**
 * Detecta tag de projeto no título/conteúdo.
 * @param {string} title
 * @param {string} content
 */
export function detectProjectTag(title, content)
{
  const text = `${title} ${content}`.toUpperCase();

  for (const tag of PROJECT_TAGS)
  {
    if (text.includes(`[${tag}]`) || text.includes(tag)) return tag;
  }

  const bracket = text.match(/\[(FINALLY|SST|HUB|CORE)\]/);
  return bracket ? bracket[1] : null;
}

/**
 * Score heurístico 0–100 para payload de ingestão (fallback + base para IA).
 * @param {{ source?: string, title: string, content?: string, priority?: string }} payload
 */
export function scoreIngestPayload(payload)
{
  const title = (payload.title || '').trim();
  const content = (payload.content || '').trim();
  const projectTag = detectProjectTag(title, content);
  const sender = payload.sender || payload.from || payload.source || 'webhook';

  const result = calculateUrgency(
    {
      titulo: title || content.slice(0, 120) || '(sem título)',
      data_vencimento: payload.due_at || payload.data_vencimento || null,
      remetente: sender,
      origem: payload.source || 'webhook',
    },
    sender,
  );

  const finalScore = result.score;

  let prioridade = 'media';
  if (finalScore >= 80) prioridade = 'critica';
  else if (finalScore >= 55) prioridade = 'alta';
  else if (finalScore < 30) prioridade = 'baixa';

  return {
    score: finalScore,
    prioridade,
    projectTag,
    rationale: result.reason,
    relevanceLog: result.log,
    source: 'mock',
  };
}

/**
 * Orquestra payload — tenta IA se houver chave; senão heurística mock.
 * @param {{ source?: string, title: string, content?: string, priority?: string }} payload
 */
export async function orchestrateIngestPayload(payload)
{
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (groqKey || geminiKey)
  {
    try
    {
      const aiScore = await fetchIngestUrgencyFromAI(payload, { groqKey, geminiKey });
      if (aiScore) return aiScore;
    }
    catch (err)
    {
      console.warn('[urgencyOrchestrator] IA indisponível, fallback mock:', err?.message || err);
    }
  }

  await new Promise((r) => setTimeout(r, 120));
  return scoreIngestPayload(payload);
}

async function fetchIngestUrgencyFromAI(payload, keys)
{
  const projectTag = detectProjectTag(payload.title, payload.content || '');
  const userPayload = JSON.stringify({
    tasks: [{
      task_id: 0,
      titulo: payload.title,
      prioridade: payload.priority || 'media',
      origem: payload.source || 'webhook',
      tags: projectTag ? [projectTag] : [],
      content_preview: (payload.content || '').slice(0, 400),
    }],
  });

  const systemPrompt = `Você é o AXEL Urgency Orchestrator. Avalie a tarefa com score 0-100.
Responda APENAS JSON: {"scores":[{"task_id":0,"score":number,"rationale":string}]}`;

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
    });

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return parseIngestAI(content, projectTag);
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
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return parseIngestAI(content, projectTag);
  }

  return null;
}

function parseIngestAI(raw, projectTag)
{
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  const row = parsed.scores?.[0];
  if (!row) return null;

  const score = Math.min(100, Math.max(0, Math.round(row.score)));
  let prioridade = 'media';
  if (score >= 80) prioridade = 'critica';
  else if (score >= 55) prioridade = 'alta';
  else if (score < 30) prioridade = 'baixa';

  return {
    score,
    prioridade,
    projectTag,
    rationale: row.rationale || 'IA',
    source: 'ai',
  };
}

const BATCH_SYSTEM_PROMPT = `Você é o AXEL — assistente pessoal de execução. Tom: direto, empático, como um melhor amigo que organiza a vida do usuário.

Priorize com critério humano:
- URGENTE ALTO (80–100): bloqueios de cliente, SST/compliance legal, prazo hoje, palavras [URGENTE], remetentes críticos
- PROJETOS: tags [SST], [FINALLY], [HUB], [CORE] elevam relevância se houver impacto real
- BAIXO (0–35): FYI, "para conhecimento", alinhamento, newsletter, CC sem ação — mesmo com prazo distante
- MÉDIO (40–70): rotina, planejamento, tarefas sem bloqueio imediato
- E-mail/webhook com tom de cobrança ou cliente → subir score
- Manual sem contexto → score moderado até haver sinal

Responda como assistente que EXPLICA a decisão ao usuário (ele pode discordar e mover manualmente).

Saída APENAS JSON válido:
{"scores":[{"task_id":number,"score":number,"rationale":string}, ...]}
- Um objeto por task_id recebido
- score inteiro 0–100 (100 = executar agora)
- rationale em português, 1–2 frases — POR QUE, tom de parceiro`;

function mockBatchScore(task)
{
  const sender = task.remetente || task.origem || 'manual';
  const result = calculateUrgency(
    {
      titulo: task.titulo || '(sem título)',
      data_vencimento: task.data_vencimento || null,
      remetente: sender,
      origem: task.origem || 'manual',
    },
    sender,
  );

  return {
    task_id: task.task_id,
    score: result.score,
    rationale: result.reason,
    source: 'mock',
  };
}

function parseBatchAI(raw)
{
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.scores)) return null;

  return parsed.scores.map((row) => ({
    task_id: row.task_id,
    score: Math.min(100, Math.max(0, Math.round(row.score))),
    rationale: row.rationale || 'Prioridade definida pela IA AXEL.',
    source: 'ai',
  }));
}

async function fetchBatchUrgencyFromAI(tasks, keys)
{
  const userPayload = JSON.stringify({ tasks });

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
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: BATCH_SYSTEM_PROMPT },
          { role: 'user', content: userPayload },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return parseBatchAI(content);
  }

  if (keys.geminiKey)
  {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: BATCH_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPayload }] }],
          generationConfig: { temperature: 0.15, responseMimeType: 'application/json' },
        }),
      },
    );

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return parseBatchAI(content);
  }

  return null;
}

/**
 * Prioriza lote de tarefas — IA no servidor ou motor de relevância local.
 * @param {Array<{ task_id: number, titulo: string, prioridade?: string, origem?: string, tags?: string[], data_vencimento?: string|null, status?: string, descricao?: string|null, remetente?: string|null }>} tasks
 */
export async function orchestrateTasksBatch(tasks)
{
  const mockScores = tasks.map((t) => mockBatchScore(t));

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!groqKey && !geminiKey)
  {
    await new Promise((r) => setTimeout(r, 80));
    return { scores: mockScores, source: 'mock' };
  }

  try
  {
    const aiScores = await fetchBatchUrgencyFromAI(tasks, { groqKey, geminiKey });
    if (!aiScores || aiScores.length === 0) throw new Error('IA retornou vazio');

    const byId = new Map(aiScores.map((s) => [s.task_id, s]));
    const merged = tasks.map((t) =>
    {
      const ai = byId.get(t.task_id);
      if (ai) return ai;
      return mockBatchScore(t);
    });

    return {
      scores: merged,
      source: merged.some((s) => s.source === 'ai') ? 'ai' : 'mock',
    };
  }
  catch (err)
  {
    console.warn('[urgencyOrchestrator] batch IA falhou:', err?.message || err);
    return { scores: mockScores, source: 'mock' };
  }
}
