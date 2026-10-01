import { create } from 'zustand'
import type { TaskWait, TaskWaitChannel, TaskWaitReason } from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './authStore'

const KEY = 'simply-life-task-waits-v1'
const MAX = 800

type StartInput = {
  taskId: string
  pessoa: string
  amigoId?: string | null
  motivo: TaskWaitReason
  canal: TaskWaitChannel | null
  nota?: string
}

type State = {
  waits: TaskWait[]
  hydrated: boolean
  hydrate: () => Promise<void>
  /** começa a esperar alguém nesta tarefa (encerra uma espera aberta anterior) */
  start: (input: StartInput) => TaskWait | null
  /** registra que você cobrou a pessoa agora */
  nudge: (waitId: string) => void
  /** a pessoa voltou: encerra a espera */
  finish: (waitId: string) => void
  remove: (waitId: string) => void
}

function newId(): string
{
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
  if (c?.randomUUID) return c.randomUUID()
  const hex = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 36; i++)
  {
    if (i === 8 || i === 13 || i === 18 || i === 23) out += '-'
    else if (i === 14) out += '4'
    else if (i === 19) out += hex[(Math.random() * 4) | 8]
    else out += hex[(Math.random() * 16) | 0]
  }
  return out
}

function canSync(): boolean
{
  return supabaseConfigured && !useAuthStore.getState().isGuest
}

function toRow(w: TaskWait, userId: string)
{
  return {
    id: w.id,
    user_id: userId,
    tarefa_id: Number(w.taskId),
    pessoa: w.pessoa.slice(0, 80),
    amigo_id: w.amigoId ?? null,
    motivo: w.motivo,
    canal: w.canal,
    desde: w.desde,
    ate: w.ate,
    cobrancas: w.cobrancas,
    nota: w.nota.slice(0, 500),
    updated_at: new Date().toISOString(),
  }
}

function fromRow(r: Record<string, unknown>): TaskWait
{
  return {
    id: String(r.id),
    taskId: String(r.tarefa_id),
    pessoa: String(r.pessoa || ''),
    amigoId: r.amigo_id ? String(r.amigo_id) : null,
    motivo: (r.motivo as TaskWaitReason) || 'fazer',
    canal: (r.canal as TaskWaitChannel | null) ?? null,
    desde: String(r.desde),
    ate: r.ate ? String(r.ate) : null,
    cobrancas: Array.isArray(r.cobrancas) ? (r.cobrancas as unknown[]).map(String) : [],
    nota: String(r.nota || ''),
  }
}

/** Grava no Supabase. Nunca lança: offline ou 070 pendente, fica no aparelho. */
async function upsertRemote(w: TaskWait): Promise<void>
{
  // tarefa local (convidado ou ainda sem id do banco) não tem como ligar
  if (!canSync() || !/^\d+$/.test(w.taskId)) return
  try
  {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    const row = toRow(w, auth.user.id)
    const { error } = await supabase.from('tarefa_esperas').upsert(row)
    // 071 pendente: grava sem o vínculo com o amigo
    if (error && /amigo_id/i.test(error.message))
    {
      const { amigo_id: _skip, ...legacy } = row
      await supabase.from('tarefa_esperas').upsert(legacy)
    }
  }
  catch
  {
    /* offline */
  }
}

async function deleteRemote(id: string): Promise<void>
{
  if (!canSync()) return
  try
  {
    await supabase.from('tarefa_esperas').delete().eq('id', id)
  }
  catch
  {
    /* offline */
  }
}

async function fetchRemote(): Promise<TaskWait[] | null>
{
  if (!canSync()) return null
  try
  {
    const { data, error } = await supabase
      .from('tarefa_esperas')
      .select('*')
      .order('desde', { ascending: false })
      .limit(MAX)
    if (error || !data) return null
    return data.map((r) => fromRow(r as Record<string, unknown>))
  }
  catch
  {
    return null
  }
}

/** Banco vence para o que ele tem; o que só existe no aparelho é mantido e reenviado. */
function merge(local: TaskWait[], remote: TaskWait[]): { merged: TaskWait[]; pending: TaskWait[] }
{
  const byId = new Map(remote.map((w) => [w.id, w]))
  const pending = local.filter((w) => !byId.has(w.id))
  const merged = [...remote, ...pending]
    .sort((a, b) => (a.desde < b.desde ? 1 : -1))
    .slice(0, MAX)
  return { merged, pending }
}

/** Esperas por outras pessoas: quem, o quê, desde quando e quantas cobranças. */
export const useTaskWaitStore = create<State>((set, get) =>
{
  const save = (waits: TaskWait[]) =>
  {
    set({ waits })
    void writeLocalJson(KEY, waits)
  }

  const patch = (id: string, fn: (w: TaskWait) => TaskWait) =>
  {
    let changed: TaskWait | null = null
    const waits = get().waits.map((w) =>
    {
      if (w.id !== id) return w
      changed = fn(w)
      return changed
    })
    if (!changed) return
    save(waits)
    void upsertRemote(changed)
  }

  return {
    waits: [],
    hydrated: false,

    hydrate: async () =>
    {
      if (get().hydrated) return
      const local = (await readLocalJson<TaskWait[]>(KEY)) ?? []
      set({ waits: local, hydrated: true })
      const remote = await fetchRemote()
      if (!remote) return
      const { merged, pending } = merge(get().waits, remote)
      save(merged)
      for (const w of pending) void upsertRemote(w)
    },

    start: ({ taskId, pessoa, amigoId, motivo, canal, nota }) =>
    {
      const name = pessoa.trim()
      if (!name) return null
      const now = new Date().toISOString()
      const wait: TaskWait = {
        id: newId(),
        taskId,
        pessoa: name,
        amigoId: amigoId ?? null,
        motivo,
        canal,
        desde: now,
        ate: null,
        cobrancas: [],
        nota: (nota ?? '').trim(),
      }
      // uma espera aberta por tarefa: a anterior termina quando a nova começa
      const closed: TaskWait[] = []
      const waits = get().waits.map((w) =>
      {
        if (w.taskId !== taskId || w.ate) return w
        const next = { ...w, ate: now }
        closed.push(next)
        return next
      })
      save([wait, ...waits].slice(0, MAX))
      for (const w of closed) void upsertRemote(w)
      void upsertRemote(wait)
      return wait
    },

    nudge: (waitId) =>
      patch(waitId, (w) => ({ ...w, cobrancas: [...w.cobrancas, new Date().toISOString()] })),

    finish: (waitId) =>
      patch(waitId, (w) => (w.ate ? w : { ...w, ate: new Date().toISOString() })),

    remove: (waitId) =>
    {
      save(get().waits.filter((w) => w.id !== waitId))
      void deleteRemote(waitId)
    },
  }
})
