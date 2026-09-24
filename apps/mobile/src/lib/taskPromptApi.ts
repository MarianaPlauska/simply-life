import {
  buildTaskPromptAiRequest,
  mergeTaskPromptParse,
  parseTaskPromptLocal,
  type TaskPromptAiResponse,
  type TaskPromptContext,
  type TaskPromptParse,
} from '@simply-life/shared'
import { apiFetch } from './apiBase'
import { supabase, supabaseConfigured } from './supabase'

const AI_TIMEOUT_MS = 12000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T>
{
  return new Promise((resolve, reject) =>
  {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) =>
      {
        clearTimeout(timer)
        resolve(v)
      },
      (e) =>
      {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

export type TaskPromptResult = TaskPromptParse & {
  /** motivo de ter ficado só no local (sem conta, sem IA no servidor, erro) */
  localReason?: 'guest' | 'offline' | 'no_ai' | 'error' | 'quota'
}

/** Leitura local instantânea (sem rede). */
export function readTaskPromptLocally(prompt: string, ctx: TaskPromptContext): TaskPromptResult
{
  return parseTaskPromptLocal(prompt, ctx)
}

/**
 * Refina a leitura local com a IA da Vercel (Groq/Gemini).
 * Nunca falha: sem conta/rede/IA, devolve a leitura local com o motivo.
 */
export async function refineTaskPromptWithAi(
  prompt: string,
  ctx: TaskPromptContext,
  local: TaskPromptParse,
  opts: { isGuest?: boolean } = {},
): Promise<TaskPromptResult>
{
  if (opts.isGuest || !supabaseConfigured) return { ...local, localReason: 'guest' }

  try
  {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) return { ...local, localReason: 'guest' }

    const res = await withTimeout(
      apiFetch('/api/axel/parse-task-prompt', {
        method: 'POST',
        token,
        body: buildTaskPromptAiRequest(prompt, ctx),
      }),
      AI_TIMEOUT_MS,
    )
    if (res.status === 429) return { ...local, localReason: 'quota' }
    if (!res.ok) return { ...local, localReason: 'error' }

    const json = (await res.json().catch(() => null)) as TaskPromptAiResponse | null
    if (!json?.iaDisponivel || !Array.isArray(json.tasks) || json.tasks.length === 0)
    {
      return { ...local, localReason: 'no_ai' }
    }
    return mergeTaskPromptParse(local, json, ctx)
  }
  catch
  {
    return { ...local, localReason: 'offline' }
  }
}
