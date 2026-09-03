import type { TarefaUnificada } from '../types'
import type { UrgencyScoreEntry } from './urgencyEngine'
import { supabaseAuthHeaders } from './supabaseAuthHeaders'

// Cliente da API de orquestração - IA no servidor (chaves não vão ao browser)

export type IntelligenceMode = 'ai' | 'local' | 'ai_ready' | 'unknown'

export interface OrchestrateTasksResponse
{
  scores: Array<{
    task_id: number
    score: number
    rationale: string
    source?: 'ai' | 'mock'
  }>
  source: 'ai' | 'mock'
  intelligence: IntelligenceMode
}

export interface IntelligenceStatusResponse
{
  intelligence: 'ai_ready' | 'local_only'
  providers: { groq: boolean; gemini: boolean }
}

export function buildOrchestratePayload(tasks: TarefaUnificada[])
{
  return tasks.map((t) => ({
    task_id: t.id,
    titulo: t.titulo,
    descricao: t.descricao?.slice(0, 400) ?? null,
    prioridade: t.prioridade,
    origem: t.origem,
    remetente: t.remetente ?? null,
    tags: (t.labels ?? []).map((l) => l.nome),
    data_vencimento: t.data_vencimento,
    status: t.status,
    snippet: t.snippet_100_char,
  }))
}

export async function fetchIntelligenceStatus(): Promise<IntelligenceStatusResponse | null>
{
  try
  {
    const res = await fetch('/api/orchestrate-tasks', { method: 'GET' })
    if (!res.ok) return null
    return (await res.json()) as IntelligenceStatusResponse
  }
  catch
  {
    return null
  }
}

export async function fetchOrchestrateScores(
  tasks: TarefaUnificada[],
): Promise<UrgencyScoreEntry[] | null>
{
  const active = tasks.filter((t) => t.status !== 'concluida')
  if (active.length === 0) return []

  try
  {
    const headers = await supabaseAuthHeaders()
    const res = await fetch('/api/orchestrate-tasks', {
      method: 'POST',
      headers,
      body: JSON.stringify({ tasks: buildOrchestratePayload(active) }),
    })

    if (!res.ok) return null

    const data = (await res.json()) as OrchestrateTasksResponse

    return data.scores.map((row) => ({
      taskId: row.task_id,
      score: row.score,
      rationale: row.rationale,
      source: row.source === 'ai' || data.source === 'ai' ? 'ai' : 'mock',
    }))
  }
  catch
  {
    return null
  }
}
