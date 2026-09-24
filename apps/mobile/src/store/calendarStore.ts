import { create } from 'zustand'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import {
  busyMinutesByDay,
  expandCalendar,
  foldText,
  googleItemsToEvents,
  type CalendarEvent,
  type GoogleApiEvent,
} from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'
import { authedApi } from '../lib/integrationsApi'

/** v1 tinha uma agenda só: a URL antiga é migrada para a lista */
const LEGACY_URL_KEY = 'simply-life-calendar-ics-url'
const CACHE_KEY = 'simply-life-calendar-cache-v2'
const DAYS = 14
const STALE_MS = 30 * 60 * 1000

export type CalendarSource = 'ics' | 'google' | null

/** Uma agenda conectada (ex.: "Gmail", "Teams do trabalho"). A URL fica à parte, no cofre. */
export type CalendarSourceItem = { id: string; kind: 'ics' | 'google'; label: string }

type Cache = {
  sources: CalendarSourceItem[]
  bySource: Record<string, CalendarEvent[]>
  syncedAt: string | null
}

type State = Cache & {
  hydrated: boolean
  syncing: boolean
  error: string | null
  /** erro por agenda (as outras continuam funcionando) */
  sourceErrors: Record<string, string>
  /** todas as agendas juntas, sem duplicar o mesmo compromisso */
  events: CalendarEvent[]
  /** compatibilidade: tipo da primeira agenda, ou null se nenhuma */
  source: CalendarSource
  hydrate: () => Promise<void>
  connectIcs: (url: string, label?: string) => Promise<boolean>
  connectGoogle: () => Promise<boolean>
  removeSource: (id: string) => Promise<void>
  disconnect: () => Promise<void>
  refresh: (force?: boolean) => Promise<void>
  busyByDay: () => Record<string, number>
}

const urlKey = (id: string) => `simply-life-cal-url-${id}`

async function secureGet(key: string): Promise<string | null>
{
  try
  {
    if (Platform.OS === 'web') return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
    return await SecureStore.getItemAsync(key)
  }
  catch
  {
    return null
  }
}

async function secureSet(key: string, value: string | null): Promise<void>
{
  try
  {
    if (Platform.OS === 'web')
    {
      if (typeof localStorage === 'undefined') return
      if (value) localStorage.setItem(key, value)
      else localStorage.removeItem(key)
      return
    }
    if (value) await SecureStore.setItemAsync(key, value)
    else await SecureStore.deleteItemAsync(key)
  }
  catch
  {
    /* sem cofre: a agenda só não fica lembrada */
  }
}

function normalizeUrl(raw: string): string | null
{
  const v = raw.trim().replace(/^webcal:\/\//i, 'https://')
  return /^https:\/\/\S+$/i.test(v) ? v : null
}

/** Rótulo automático pelo endereço (dá para trocar ao conectar). */
export function guessCalendarLabel(url: string): string
{
  if (/google\.com/i.test(url)) return 'Google'
  if (/office365|outlook/i.test(url)) return 'Outlook / Teams'
  if (/icloud/i.test(url)) return 'iPhone'
  return 'Agenda'
}

async function fetchIcsText(url: string): Promise<string>
{
  if (Platform.OS !== 'web')
  {
    const r = await fetch(url, { headers: { Accept: 'text/calendar' } })
    if (!r.ok) throw new Error(`A agenda respondeu ${r.status}. Confira o endereço.`)
    const text = await r.text()
    if (!text.includes('BEGIN:VCALENDAR')) throw new Error('Esse endereço não é de uma agenda iCal.')
    return text
  }
  const api = await authedApi()
  const res = await api('/api/integrations/calendar/ics', { method: 'POST', body: { url } })
  if (!res.ok) throw new Error(String(res.json.error || 'Não consegui ler a agenda. No navegador é preciso estar logada.'))
  return String(res.json.ics || '')
}

async function fetchGoogleEvents(): Promise<CalendarEvent[]>
{
  const api = await authedApi()
  const res = await api(`/api/integrations/google/calendar-events?days=${DAYS}`)
  if (!res.ok) throw new Error(String(res.json.error || 'Não consegui ler o Google Agenda.'))
  if (!res.json.connected) throw new Error('Conecte sua conta Google em Configurações → Integrações primeiro.')
  if (res.json.scope === false) throw new Error('Sua conexão Google não deu acesso à agenda. Reconecte em Configurações e aceite "ver sua agenda".')
  return googleItemsToEvents((res.json.items as GoogleApiEvent[]) ?? [], { days: DAYS })
}

async function fetchSource(src: CalendarSourceItem): Promise<CalendarEvent[]>
{
  if (src.kind === 'google') return fetchGoogleEvents()
  const url = await secureGet(urlKey(src.id))
  if (!url) throw new Error('Endereço desta agenda não está neste aparelho. Conecte de novo.')
  return expandCalendar(await fetchIcsText(url), { days: DAYS })
}

/**
 * Junta as agendas. O mesmo compromisso em duas agendas (convite do Teams que
 * também caiu no Gmail) aparece uma vez só: mesmo título, dia e horário.
 */
function mergeSources(sources: CalendarSourceItem[], bySource: Record<string, CalendarEvent[]>): CalendarEvent[]
{
  const seen = new Map<string, CalendarEvent>()
  for (const src of sources)
  {
    for (const e of bySource[src.id] ?? [])
    {
      const k = `${foldText(e.titulo).replace(/\s+/g, ' ').trim()}|${e.date}|${e.inicio}|${e.fim}`
      const prev = seen.get(k)
      if (prev)
      {
        // se uma das agendas marca como ocupado, está ocupado
        if (e.busy && !prev.busy) seen.set(k, { ...prev, busy: true })
        continue
      }
      seen.set(k, { ...e, id: `${src.id}:${e.id}`, origem: src.label })
    }
  }
  return [...seen.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.inicio ?? -1) - (b.inicio ?? -1)))
}

function newId(): string
{
  return `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function derive(c: Cache): Pick<State, 'events' | 'source'>
{
  return { events: mergeSources(c.sources, c.bySource), source: c.sources[0]?.kind ?? null }
}

export const useCalendarStore = create<State>((set, get) =>
{
  const save = (c: Cache) =>
  {
    set({ ...c, ...derive(c) })
    void writeLocalJson(CACHE_KEY, c)
  }
  const cacheOf = (): Cache => ({ sources: get().sources, bySource: get().bySource, syncedAt: get().syncedAt })

  return {
    sources: [],
    bySource: {},
    syncedAt: null,
    events: [],
    source: null,
    hydrated: false,
    syncing: false,
    error: null,
    sourceErrors: {},

    hydrate: async () =>
    {
      if (get().hydrated) return
      let cache = (await readLocalJson<Cache>(CACHE_KEY)) ?? { sources: [], bySource: {}, syncedAt: null }
      // migração da versão com uma agenda só
      const legacy = await secureGet(LEGACY_URL_KEY)
      if (legacy && !cache.sources.length)
      {
        const src: CalendarSourceItem = { id: 'principal', kind: 'ics', label: guessCalendarLabel(legacy) }
        await secureSet(urlKey(src.id), legacy)
        await secureSet(LEGACY_URL_KEY, null)
        cache = { ...cache, sources: [src] }
        void writeLocalJson(CACHE_KEY, cache)
      }
      set({ ...cache, ...derive(cache), hydrated: true })
    },

    connectIcs: async (raw, label) =>
    {
      await get().hydrate()
      const url = normalizeUrl(raw)
      if (!url)
      {
        set({ error: 'Cole o endereço completo, começando com https:// ou webcal://' })
        return false
      }
      set({ syncing: true, error: null })
      try
      {
        const events = expandCalendar(await fetchIcsText(url), { days: DAYS })
        const src: CalendarSourceItem = { id: newId(), kind: 'ics', label: (label || '').trim() || guessCalendarLabel(url) }
        await secureSet(urlKey(src.id), url)
        const c = cacheOf()
        save({ sources: [...c.sources, src], bySource: { ...c.bySource, [src.id]: events }, syncedAt: new Date().toISOString() })
        return true
      }
      catch (e)
      {
        set({ error: e instanceof Error ? e.message : 'Não consegui ler a agenda.' })
        return false
      }
      finally
      {
        set({ syncing: false })
      }
    },

    connectGoogle: async () =>
    {
      await get().hydrate()
      set({ syncing: true, error: null })
      try
      {
        const events = await fetchGoogleEvents()
        const c = cacheOf()
        const existing = c.sources.find((s) => s.kind === 'google')
        const src = existing ?? { id: 'google', kind: 'google' as const, label: 'Google (conta conectada)' }
        save({
          sources: existing ? c.sources : [...c.sources, src],
          bySource: { ...c.bySource, [src.id]: events },
          syncedAt: new Date().toISOString(),
        })
        return true
      }
      catch (e)
      {
        set({ error: e instanceof Error ? e.message : 'Não consegui ler o Google Agenda.' })
        return false
      }
      finally
      {
        set({ syncing: false })
      }
    },

    removeSource: async (id) =>
    {
      await secureSet(urlKey(id), null)
      const c = cacheOf()
      const { [id]: _gone, ...bySource } = c.bySource
      const { [id]: _err, ...sourceErrors } = get().sourceErrors
      set({ sourceErrors })
      save({ sources: c.sources.filter((s) => s.id !== id), bySource, syncedAt: c.syncedAt })
    },

    disconnect: async () =>
    {
      for (const s of get().sources) await secureSet(urlKey(s.id), null)
      set({ sourceErrors: {}, error: null })
      save({ sources: [], bySource: {}, syncedAt: null })
    },

    refresh: async (force) =>
    {
      await get().hydrate()
      const { sources, syncedAt, syncing } = get()
      if (!sources.length || syncing) return
      if (!force && syncedAt && Date.now() - new Date(syncedAt).getTime() < STALE_MS) return
      set({ syncing: true })
      try
      {
        const results = await Promise.allSettled(sources.map((s) => fetchSource(s)))
        const c = cacheOf()
        const bySource = { ...c.bySource }
        const sourceErrors: Record<string, string> = {}
        results.forEach((r, i) =>
        {
          const id = sources[i].id
          if (r.status === 'fulfilled') bySource[id] = r.value
          else sourceErrors[id] = r.reason instanceof Error ? r.reason.message : 'Falha ao atualizar'
        })
        set({ sourceErrors, error: null })
        save({ sources: c.sources, bySource, syncedAt: new Date().toISOString() })
      }
      finally
      {
        set({ syncing: false })
      }
    },

    busyByDay: () => busyMinutesByDay(get().events),
  }
})
