import { create } from 'zustand'
import type { CompletionEntry, PlanRecord } from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { cancelEveningPlanReminder, scheduleEveningPlanReminder } from '../lib/pushNotifications'
import { useAuthStore } from './authStore'

const KEY = 'simply-life-plan-log-v1'
const MAX_PLANS = 90
const MAX_COMPLETIONS = 800
const MAX_WORRIES = 120

/** Preocupação "estacionada" à noite. Fica SÓ no aparelho (conteúdo sensível). */
export type ParkedWorry = { id: string; at: string; text: string; resolved: boolean }

export type EveningReminder = { enabled: boolean; hour: number; minute: number }

type Persisted = {
  plans: PlanRecord[]
  completions: CompletionEntry[]
  worries: ParkedWorry[]
  reminder: EveningReminder
  /** último dia em que o card da noite foi dispensado */
  eveningDismissed: string | null
}

const DEFAULTS: Persisted = {
  plans: [],
  completions: [],
  worries: [],
  reminder: { enabled: false, hour: 21, minute: 0 },
  eveningDismissed: null,
}

type State = Persisted & {
  hydrated: boolean
  hydrate: () => Promise<void>
  savePlan: (plan: PlanRecord) => Promise<void>
  planFor: (iso: string) => PlanRecord | null
  recordCompletion: (taskId: string, at?: string) => void
  forgetCompletion: (taskId: string) => void
  parkWorries: (texts: string[]) => void
  resolveWorry: (id: string) => void
  setReminder: (next: EveningReminder) => Promise<boolean>
  dismissEvening: (iso: string) => void
}

function persist(s: Persisted): void
{
  void writeLocalJson(KEY, {
    plans: s.plans,
    completions: s.completions,
    worries: s.worries,
    reminder: s.reminder,
    eveningDismissed: s.eveningDismissed,
  })
}

function rowToPlan(r: Record<string, unknown>): PlanRecord
{
  return {
    date: String(r.plan_date),
    mode: r.mode as PlanRecord['mode'],
    mood: r.mood == null ? null : Number(r.mood),
    energy: (r.energy as PlanRecord['energy']) ?? 'media',
    anxiety: (Number(r.anxiety) || 0) as PlanRecord['anxiety'],
    essentialIds: (r.essential_ids as string[]) ?? [],
    plannedIds: (r.planned_ids as string[]) ?? [],
    capacityMin: Number(r.capacity_min) || 0,
    plannedMin: Number(r.planned_min) || 0,
    worriesCount: Number(r.worries_count) || 0,
    createdAt: String(r.created_at ?? ''),
  }
}

async function upsertRemotePlan(plan: PlanRecord): Promise<void>
{
  if (!supabaseConfigured || useAuthStore.getState().isGuest) return
  try
  {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return
    await supabase.from('daily_plans').upsert({
      user_id: auth.user.id,
      plan_date: plan.date,
      mode: plan.mode,
      mood: plan.mood,
      energy: plan.energy,
      anxiety: plan.anxiety,
      essential_ids: plan.essentialIds,
      planned_ids: plan.plannedIds,
      capacity_min: plan.capacityMin,
      planned_min: plan.plannedMin,
      worries_count: plan.worriesCount,
    }, { onConflict: 'user_id,plan_date' })
  }
  catch
  {
    /* tabela ausente (059 pendente) ou offline: plano segue local */
  }
}

async function fetchRemotePlans(): Promise<PlanRecord[]>
{
  if (!supabaseConfigured || useAuthStore.getState().isGuest) return []
  try
  {
    const since = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .gte('plan_date', since)
      .order('plan_date', { ascending: false })
    if (error || !data) return []
    return data.map(rowToPlan)
  }
  catch
  {
    return []
  }
}

function mergePlans(a: PlanRecord[], b: PlanRecord[]): PlanRecord[]
{
  const byDate = new Map<string, PlanRecord>()
  for (const p of [...a, ...b])
  {
    const prev = byDate.get(p.date)
    if (!prev || (p.createdAt || '') >= (prev.createdAt || '')) byDate.set(p.date, p)
  }
  return [...byDate.values()].sort((x, y) => (x.date < y.date ? 1 : -1)).slice(0, MAX_PLANS)
}

function uid(): string
{
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export const usePlanLogStore = create<State>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const saved = await readLocalJson<Partial<Persisted>>(KEY)
    const local: Persisted = { ...DEFAULTS, ...(saved ?? {}) }
    set({ ...local, hydrated: true })
    const remote = await fetchRemotePlans()
    if (remote.length)
    {
      const plans = mergePlans(get().plans, remote)
      set({ plans })
      persist(get())
    }
  },

  savePlan: async (plan) =>
  {
    const plans = mergePlans(get().plans.filter((p) => p.date !== plan.date), [plan])
    set({ plans })
    persist(get())
    await upsertRemotePlan(plan)
  },

  planFor: (iso) => get().plans.find((p) => p.date === iso) ?? null,

  recordCompletion: (taskId, at) =>
  {
    const completions = [
      { taskId, at: at ?? new Date().toISOString() },
      ...get().completions.filter((c) => c.taskId !== taskId),
    ].slice(0, MAX_COMPLETIONS)
    set({ completions })
    persist(get())
  },

  forgetCompletion: (taskId) =>
  {
    set({ completions: get().completions.filter((c) => c.taskId !== taskId) })
    persist(get())
  },

  parkWorries: (texts) =>
  {
    const at = new Date().toISOString()
    const fresh = texts
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ id: uid(), at, text: text.slice(0, 500), resolved: false }))
    if (!fresh.length) return
    set({ worries: [...fresh, ...get().worries].slice(0, MAX_WORRIES) })
    persist(get())
  },

  resolveWorry: (id) =>
  {
    set({ worries: get().worries.map((w) => (w.id === id ? { ...w, resolved: true } : w)) })
    persist(get())
  },

  setReminder: async (next) =>
  {
    let ok = true
    if (next.enabled) ok = await scheduleEveningPlanReminder(next.hour, next.minute)
    else await cancelEveningPlanReminder()
    const reminder = { ...next, enabled: next.enabled && ok }
    set({ reminder })
    persist(get())
    return ok
  },

  dismissEvening: (iso) =>
  {
    set({ eveningDismissed: iso })
    persist(get())
  },
}))
