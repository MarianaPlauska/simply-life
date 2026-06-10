import { calculateAdaptiveUrgency } from './adaptiveOrchestration'
import type { TarefaUnificada } from '../types'

// Motor de Urgência ORION — orquestração de contexto (IA + fallback mock)

export interface UrgencyScoreEntry
{
  taskId: number
  score: number
  rationale?: string
  source: 'ai' | 'mock'
}

/** Resposta esperada da IA — array JSON estrito */
export interface UrgencyAIResponse
{
  scores: Array<{
    task_id: number
    score: number
    rationale: string
  }>
}

/** Instrução de sistema enviada ao provedor (Gemini / Groq) */
export const URGENCY_SYSTEM_PROMPT = `Você é o ORION Urgency Orchestrator, um motor de produtividade que prioriza tarefas de um operador técnico.

Sua função:
- Avaliar cada tarefa com score de 0 a 100 (100 = ação imediata).
- Considerar peso das tags de projeto (ex: SST, FINALLY, CORE), palavras de urgência no título, prioridade declarada, origem (e-mail, webhook, GitHub) e proximidade do prazo.
- Tarefas de compliance/SST/e-Social com prazo curto devem pontuar acima de 90.
- Backlog técnico (infra, schema, Docker) pontua conforme impacto e prazo, não acima de urgências legais/críticas sem motivo.

Regras de saída:
- Responda APENAS com JSON válido, sem markdown, sem texto extra.
- Formato exato: {"scores":[{"task_id":number,"score":number,"rationale":string}, ...]}
- Um objeto por tarefa recebida no input.
- score deve ser inteiro entre 0 e 100.`

function buildUserPayload(tasks: TarefaUnificada[]): string
{
  const payload = tasks.map((t) =>
  ({
    task_id: t.id,
    titulo: t.titulo,
    prioridade: t.prioridade,
    origem: t.origem,
    tags: (t.labels ?? []).map((l) => l.nome),
    data_vencimento: t.data_vencimento,
    status: t.status,
  }))

  return JSON.stringify({ tasks: payload })
}

/** Fallback local — Motor de Relevância (influência + semântica + prazo) */
function mockScoreTask(task: TarefaUnificada, allTasks: TarefaUnificada[]): UrgencyScoreEntry
{
  const result = calculateAdaptiveUrgency(task, allTasks)

  return {
    taskId: task.id,
    score: result.adjustedScore,
    rationale: result.reason,
    source: 'mock',
  }
}

function mockCalculateUrgencyScores(tasks: TarefaUnificada[]): UrgencyScoreEntry[]
{
  const active = tasks.filter((t) => t.status !== 'concluida')
  return active.map((t) => mockScoreTask(t, active))
}

function parseAIResponse(raw: string): UrgencyScoreEntry[]
{
  const parsed = JSON.parse(raw) as UrgencyAIResponse
  if (!Array.isArray(parsed.scores))
  {
    throw new Error('Resposta IA inválida: campo scores ausente')
  }

  return parsed.scores.map((row) =>
  ({
    taskId: row.task_id,
    score: Math.min(100, Math.max(0, Math.round(row.score))),
    rationale: row.rationale,
    source: 'ai' as const,
  }))
}

/** Chamada real ao provedor — descomentar quando VITE_GROQ_API_KEY ou VITE_GEMINI_API_KEY estiver configurada */
async function fetchUrgencyFromAI(tasks: TarefaUnificada[]): Promise<UrgencyScoreEntry[]>
{
  const groqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  if (!groqKey && !geminiKey)
  {
    throw new Error('Nenhuma chave de IA configurada (VITE_GROQ_API_KEY / VITE_GEMINI_API_KEY)')
  }

  const userPayload = buildUserPayload(tasks)

  // Referência explícita — usado nos blocos Groq/Gemini abaixo ao ativar a IA
  void userPayload
  void parseAIResponse

  /*
  // ── Groq (Llama / Mixtral) ─────────────────────────────────────
  if (groqKey)
  {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: URGENCY_SYSTEM_PROMPT },
          { role: 'user', content: userPayload },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Groq retornou resposta vazia')
    return parseAIResponse(content)
  }
  */

  /*
  // ── Google Gemini 1.5 Flash ───────────────────────────────────
  if (geminiKey)
  {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: URGENCY_SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: userPayload }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error('Gemini retornou resposta vazia')
    return parseAIResponse(content)
  }
  */

  throw new Error('Integração IA preparada mas ainda não ativada — use fallback mock')
}

/**
 * Calcula scores de urgência para a lista de tarefas.
 * Tenta IA quando houver chave; caso contrário usa heurística mock.
 */
export async function calculateUrgencyScores(tasks: TarefaUnificada[]): Promise<UrgencyScoreEntry[]>
{
  const active = tasks.filter((t) => t.status !== 'concluida')
  if (active.length === 0) return []

  const hasApiKey = Boolean(
    import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY,
  )

  if (hasApiKey)
  {
    try
    {
      return await fetchUrgencyFromAI(active)
    }
    catch (err)
    {
      console.warn('[urgencyEngine] IA indisponível, usando mock:', err)
    }
  }

  // Simula latência mínima da orquestração
  await new Promise((resolve) => setTimeout(resolve, 420))

  return mockCalculateUrgencyScores(active)
}

/** Aplica scores calculados sobre cópias das tarefas (imutável) */
export function applyUrgencyScores(
  tasks: TarefaUnificada[],
  scores: UrgencyScoreEntry[],
): TarefaUnificada[]
{
  const byId = new Map(scores.map((s) => [s.taskId, s.score]))

  return tasks.map((t) =>
  {
    const next = byId.get(t.id)
    if (next === undefined) return t
    return { ...t, score_urgencia: next }
  })
}

/** Classe Tailwind da badge conforme faixa do motor */
export function urgencyBadgeClass(score: number): string
{
  if (score > 90) return 'text-urgente'
  if (score > 70) return 'text-atencao'
  return 'text-ink-muted'
}
