import {
  DUMP_LOW_CONFIDENCE,
  buildDumpAiRequest,
  classifyDump,
  mergeDumpAi,
  type DumpAiResponse,
  type DumpContext,
  type DumpItem,
} from '@simply-life/shared'
import { apiFetch } from './apiBase'
import { supabase, supabaseConfigured } from './supabase'

const AI_TIMEOUT_MS = 12000

export type DumpReadResult = {
  items: DumpItem[]
  /** por que a IA não entrou (ou 'ia' se entrou em ao menos uma linha) */
  via: 'local' | 'ia' | 'guest' | 'offline' | 'error' | 'quota' | 'no_ai'
}

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

/** Leitura local instantânea, sem rede. */
export function readDumpLocally(text: string, ref = new Date()): DumpItem[]
{
  return classifyDump(text, { ref })
}

/**
 * Manda só as linhas de baixa confiança para a IA e junta com a leitura local.
 * Nunca falha: sem conta, sem rede ou sem rota (404), devolve a leitura local.
 */
export async function refineDumpWithAi(
  local: DumpItem[],
  opts: { isGuest?: boolean; ref?: Date } = {},
): Promise<DumpReadResult>
{
  const doubtful = local.filter((i) => i.confianca < DUMP_LOW_CONFIDENCE)
  if (doubtful.length === 0) return { items: local, via: 'local' }
  if (opts.isGuest || !supabaseConfigured) return { items: local, via: 'guest' }
  if (typeof navigator !== 'undefined' && (navigator as { onLine?: boolean }).onLine === false)
  {
    return { items: local, via: 'offline' }
  }

  const ref = opts.ref ?? new Date()
  const ctx: DumpContext = { ref }
  try
  {
    const { data: session } = await supabase.auth.getSession()
    const token = session.session?.access_token
    if (!token) return { items: local, via: 'guest' }

    const res = await withTimeout(
      apiFetch('/api/axel/classify-dump', {
        method: 'POST',
        token,
        body: buildDumpAiRequest(doubtful.map((i) => i.linha), ctx),
      }),
      AI_TIMEOUT_MS,
    )
    if (res.status === 429) return { items: local, via: 'quota' }
    if (!res.ok) return { items: local, via: 'error' }

    const json = (await res.json().catch(() => null)) as DumpAiResponse | null
    if (!json || json.iaDisponivel === false || !Array.isArray(json.items) || json.items.length === 0)
    {
      return { items: local, via: 'no_ai' }
    }
    const merged = mergeDumpAi(local, json, ctx)
    const changed = merged.some((m, i) => m !== local[i])
    return { items: merged, via: changed ? 'ia' : 'no_ai' }
  }
  catch
  {
    return { items: local, via: 'offline' }
  }
}
