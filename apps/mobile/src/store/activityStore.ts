import { create } from 'zustand'
import { isEloAcao, localTodayIso, type EloAcao } from '@simply-life/shared'
import {
  isPersistReady,
  persistStorage,
  runHydrated,
  whenPersistReady,
  type SyncStorage,
} from '../lib/persistStorage'

const KEY = 'simply_life_activity_days_v1'
/** Maior elo já visto neste aparelho (o cálculo também olha o histórico inteiro). */
const RECORDE_KEY = 'simply_life_elo_recorde_v1'
/** Dias mexidos desde o último envio ao servidor (tabela elo_dias, migração 076). */
const PENDENTES_KEY = 'simply_life_elo_pendentes_v1'

/** Chaves por conta: saem no "Sair" (ver lib/userLocalData). */
export const ACTIVITY_LOCAL_KEYS = [KEY, RECORDE_KEY, PENDENTES_KEY] as const

/** Ações que cumprem o dia. 'meal' entra pela tela de comida. */
export type LifeActionKind = EloAcao

export type ActivityDay = {
  opened: boolean
  actions: LifeActionKind[]
}

type PersistShape = Record<string, ActivityDay>

type State = {
  days: PersistShape
  recorde: number
  /** dias ainda não enviados ao servidor */
  pendentes: string[]
  hydrate: () => void
  markOpen: () => void
  /** `iso` = dia da ação (rotina marcada num dia passado). Padrão: hoje. */
  markAction: (kind: LifeActionKind, iso?: string) => void
  seedDates: (isos: string[], kind: LifeActionKind) => void
  /** junta dias vindos do servidor (união das ações) */
  mergeRemote: (rows: { dia: string; acoes: string[] }[]) => void
  saveRecorde: (n: number) => void
  clearPendentes: (isos: string[]) => void
  /** apaga tudo deste aparelho (Sair da conta) */
  reset: () => void
}

let loaded = false

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/

function storage(): SyncStorage
{
  return persistStorage
}

function readDays(): PersistShape
{
  try
  {
    const raw = storage().getItem(KEY)
    return raw ? (JSON.parse(raw) as PersistShape) : {}
  }
  catch
  {
    return {}
  }
}

function readList(key: string): string[]
{
  try
  {
    const raw = storage().getItem(key)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : []
  }
  catch
  {
    return []
  }
}

function writeDays(days: PersistShape)
{
  storage().setItem(KEY, JSON.stringify(days))
}

function writePendentes(list: string[])
{
  storage().setItem(PENDENTES_KEY, JSON.stringify(list))
}

function ensureDay(days: PersistShape, iso: string): ActivityDay
{
  return days[iso] ?? { opened: false, actions: [] }
}

function withPendente(list: string[], isos: string[]): string[]
{
  const set = new Set(list)
  for (const iso of isos) set.add(iso)
  return [...set].sort()
}

export const useActivityStore = create<State>((set, get) => ({
  days: {},
  recorde: 0,
  pendentes: [],

  hydrate: () =>
  {
    if (!isPersistReady())
    {
      void whenPersistReady().then(() => get().hydrate())
      return
    }
    loaded = true
    const raw = parseInt(storage().getItem(RECORDE_KEY) ?? '0', 10)
    set({
      days: readDays(),
      recorde: Number.isFinite(raw) ? raw : 0,
      pendentes: readList(PENDENTES_KEY),
    })
  },

  markOpen: () =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().markOpen())) return
    const iso = localTodayIso()
    const days = { ...get().days }
    const row = ensureDay(days, iso)
    if (row.opened) return
    days[iso] = { ...row, opened: true }
    writeDays(days)
    set({ days })
  },

  markAction: (kind, isoArg) =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().markAction(kind, isoArg))) return
    const today = localTodayIso()
    const iso = isoArg && ISO_RE.test(isoArg.slice(0, 10)) ? isoArg.slice(0, 10) : today
    // nada marca o futuro
    if (iso > today) return
    const days = { ...get().days }
    const row = ensureDay(days, iso)
    if (row.actions.includes(kind) && row.opened) return
    const actions = row.actions.includes(kind) ? row.actions : [...row.actions, kind]
    days[iso] = { opened: true, actions }
    writeDays(days)
    const pendentes = withPendente(get().pendentes, [iso])
    writePendentes(pendentes)
    set({ days, pendentes })
  },

  seedDates: (isos, kind) =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().seedDates(isos, kind))) return
    const today = localTodayIso()
    const days = { ...get().days }
    const touched: string[] = []
    for (const raw of isos)
    {
      const iso = raw.slice(0, 10)
      if (!ISO_RE.test(iso) || iso > today) continue
      const row = ensureDay(days, iso)
      if (row.actions.includes(kind)) continue
      days[iso] = { opened: true, actions: [...row.actions, kind] }
      touched.push(iso)
    }
    if (!touched.length) return
    writeDays(days)
    const pendentes = withPendente(get().pendentes, touched)
    writePendentes(pendentes)
    set({ days, pendentes })
  },

  mergeRemote: (rows) =>
  {
    if (!runHydrated(() => loaded, () => get().hydrate(), () => get().mergeRemote(rows))) return
    const days = { ...get().days }
    let changed = false
    for (const r of rows)
    {
      const iso = String(r.dia ?? '').slice(0, 10)
      if (!ISO_RE.test(iso)) continue
      const row = ensureDay(days, iso)
      const extra = (r.acoes ?? []).filter(isEloAcao).filter((k) => !row.actions.includes(k))
      if (!extra.length) continue
      days[iso] = { opened: true, actions: [...row.actions, ...extra] }
      changed = true
    }
    if (!changed) return
    writeDays(days)
    set({ days })
  },

  saveRecorde: (n) =>
  {
    if (!loaded || !Number.isFinite(n) || n <= get().recorde) return
    storage().setItem(RECORDE_KEY, String(Math.floor(n)))
    set({ recorde: Math.floor(n) })
  },

  clearPendentes: (isos) =>
  {
    if (!loaded || !isos.length) return
    const drop = new Set(isos)
    const pendentes = get().pendentes.filter((iso) => !drop.has(iso))
    writePendentes(pendentes)
    set({ pendentes })
  },

  reset: () =>
  {
    for (const key of ACTIVITY_LOCAL_KEYS) storage().removeItem(key)
    set({ days: {}, recorde: 0, pendentes: [] })
  },
}))

export function actionIsos(days: PersistShape): string[]
{
  return Object.keys(days).filter((iso) => (days[iso]?.actions.length ?? 0) > 0)
}

export function openIsos(days: PersistShape): string[]
{
  return Object.keys(days).filter((iso) => days[iso]?.opened)
}
