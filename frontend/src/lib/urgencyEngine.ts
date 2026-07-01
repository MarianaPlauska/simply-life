import { calculateAdaptiveUrgency } from './adaptiveOrchestration'
import { fetchOrchestrateScores } from './orchestrateApi'
import type { TarefaUnificada } from '../types'

// Motor de Urgência AXEL — IA no servidor → cliente (dev) → heurística local

export interface UrgencyScoreEntry
{
  taskId: number
  score: number
  rationale?: string
  source: 'ai' | 'mock'
}

/** @deprecated prompt usado no servidor — api/_lib/urgencyOrchestrator.js */
export const URGENCY_SYSTEM_PROMPT = ''

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

/** Fallback dev — chaves VITE_* só em desenvolvimento local; nunca em produção */
async function fetchUrgencyFromClientAI(tasks: TarefaUnificada[]): Promise<UrgencyScoreEntry[]>
{
  if (!import.meta.env.DEV)
  {
    throw new Error('IA no cliente desabilitada em produção')
  }

  const groqKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  if (!groqKey && !geminiKey)
  {
    throw new Error('Sem chave local')
  }

  const payload = JSON.stringify({
    tasks: tasks.map((t) => ({
      task_id: t.id,
      titulo: t.titulo,
      descricao: t.descricao?.slice(0, 400),
      prioridade: t.prioridade,
      origem: t.origem,
      remetente: t.remetente,
      tags: (t.labels ?? []).map((l) => l.nome),
      data_vencimento: t.data_vencimento,
      status: t.status,
    })),
  })

  const systemPrompt = `Você é o AXEL. Retorne JSON: {"scores":[{"task_id":n,"score":0-100,"rationale":"..."}]}`

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
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: payload },
        ],
      }),
    })

    if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    const parsed = JSON.parse(content) as { scores: Array<{ task_id: number; score: number; rationale: string }> }

    return parsed.scores.map((row) => ({
      taskId: row.task_id,
      score: Math.min(100, Math.max(0, Math.round(row.score))),
      rationale: row.rationale,
      source: 'ai' as const,
    }))
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: payload }] }],
        generationConfig: { temperature: 0.15, responseMimeType: 'application/json' },
      }),
    },
  )

  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  const parsed = JSON.parse(content) as { scores: Array<{ task_id: number; score: number; rationale: string }> }

  return parsed.scores.map((row) => ({
    taskId: row.task_id,
    score: Math.min(100, Math.max(0, Math.round(row.score))),
    rationale: row.rationale,
    source: 'ai' as const,
  }))
}

/**
 * Calcula scores — ordem: API servidor (IA) → cliente dev → motor local.
 */
export async function calculateUrgencyScores(tasks: TarefaUnificada[]): Promise<UrgencyScoreEntry[]>
{
  const active = tasks.filter((t) => t.status !== 'concluida')
  if (active.length === 0) return []

  const fromApi = await fetchOrchestrateScores(tasks)
  if (fromApi && fromApi.length > 0)
  {
    return fromApi
  }

  try
  {
    return await fetchUrgencyFromClientAI(active)
  }
  catch
  {
    /* fallback local */
  }

  await new Promise((resolve) => setTimeout(resolve, 280))
  return mockCalculateUrgencyScores(tasks)
}

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

export function urgencyBadgeClass(score: number): string
{
  if (score > 90) return 'text-urgente'
  if (score > 70) return 'text-atencao'
  return 'text-ink-muted'
}
