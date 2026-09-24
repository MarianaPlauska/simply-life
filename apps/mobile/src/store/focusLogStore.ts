import { create } from 'zustand'
import type { FocusSessionLog } from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useAuthStore } from './authStore'

const KEY = 'simply-life-focus-log-v1'
const MAX = 1500
const REMOTE_DAYS = 120

type State = {
  sessions: FocusSessionLog[]
  hydrated: boolean
  hydrate: () => Promise<void>
  /** registra minutos reais de foco (local + tabela sessoes_foco) */
  record: (taskId: string | null, minutes: number) => void
}

function key(s: FocusSessionLog): string
{
  return `${s.taskId ?? '-'}|${s.at.slice(0, 16)}|${s.minutes}`
}

function merge(a: FocusSessionLog[], b: FocusSessionLog[]): FocusSessionLog[]
{
  const seen = new Map<string, FocusSessionLog>()
  for (const s of [...a, ...b]) seen.set(key(s), s)
  return [...seen.values()].sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, MAX)
}

async function insertRemote(s: FocusSessionLog): Promise<void>
{
  if (!supabaseConfigured || useAuthStore.getState().isGuest) return
  try
  {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    // XP já é dado no app (gamificação local); aqui só o tempo real
    await supabase.from('sessoes_foco').insert({
      user_id: auth.user.id,
      tarefa_id: s.taskId && /^\d+$/.test(s.taskId) ? Number(s.taskId) : null,
      duracao_minutos: s.minutes,
      xp_ganho: 0,
      created_at: s.at,
    })
  }
  catch
  {
    /* offline: fica no aparelho */
  }
}

async function fetchRemote(): Promise<FocusSessionLog[]>
{
  if (!supabaseConfigured || useAuthStore.getState().isGuest) return []
  try
  {
    const since = new Date(Date.now() - REMOTE_DAYS * 86400000).toISOString()
    const { data, error } = await supabase
      .from('sessoes_foco')
      .select('tarefa_id, duracao_minutos, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(MAX)
    if (error || !data) return []
    return data.map((r) => ({
      taskId: r.tarefa_id == null ? null : String(r.tarefa_id),
      minutes: Number(r.duracao_minutos) || 0,
      at: String(r.created_at),
    }))
  }
  catch
  {
    return []
  }
}

/** Histórico de tempo real de foco: base para o Axel aprender quanto você demora. */
export const useFocusLogStore = create<State>((set, get) => ({
  sessions: [],
  hydrated: false,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const local = (await readLocalJson<FocusSessionLog[]>(KEY)) ?? []
    set({ sessions: local, hydrated: true })
    const remote = await fetchRemote()
    if (remote.length)
    {
      const sessions = merge(get().sessions, remote)
      set({ sessions })
      void writeLocalJson(KEY, sessions)
    }
  },

  record: (taskId, minutes) =>
  {
    const m = Math.round(minutes)
    if (m < 1) return
    const s: FocusSessionLog = { taskId, minutes: m, at: new Date().toISOString() }
    const sessions = merge(get().sessions, [s])
    set({ sessions })
    void writeLocalJson(KEY, sessions)
    void insertRemote(s)
  },
}))
