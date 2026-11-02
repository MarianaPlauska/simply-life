import { create } from 'zustand'
import {
  burnoutSpan,
  holdReleasesAt,
  localTodayIso,
  placeSlug,
  protectedIsoDates,
  type BodyCheckId,
  type BurnoutSpan,
  type SavedPlace,
} from '@simply-life/shared'
import { readLocalJson, writeLocalJson } from '../lib/localJsonStore'

const KEY = 'simply-life-care-extras-v1'

export type StoredHold = {
  id: string
  titulo: string
  valor: number
  data: string
  categoria: string
  cardId: string | null
  forma: 'debito' | 'cartao' | 'boleto'
  folderId: string | null
  liberaEm: string
}

type Persisted = {
  energyStock: number
  burnoutActive: BurnoutSpan | null
  burnoutHistory: BurnoutSpan[]
  bodyByDay: Record<string, Partial<Record<BodyCheckId, boolean>>>
  places: SavedPlace[]
  hereSlug: string | null
  transitionBufferMin: number
  impulseEnabled: boolean
  impulseThreshold: number
  holds: StoredHold[]
}

const EMPTY: Persisted = {
  energyStock: 8,
  burnoutActive: null,
  burnoutHistory: [],
  bodyByDay: {},
  places: [],
  hereSlug: null,
  transitionBufferMin: 0,
  impulseEnabled: false,
  impulseThreshold: 80,
  holds: [],
}

function asSpan(value: unknown): BurnoutSpan | null
{
  if (!value || typeof value !== 'object') return null
  const row = value as { from?: unknown; until?: unknown }
  if (typeof row.from !== 'string' || typeof row.until !== 'string') return null
  if (row.until < row.from) return null
  return { from: row.from.slice(0, 10), until: row.until.slice(0, 10) }
}

function normalize(raw: unknown): Persisted
{
  if (!raw || typeof raw !== 'object') return EMPTY
  const row = raw as Partial<Persisted>
  const stock = Number(row.energyStock)
  const threshold = Number(row.impulseThreshold)
  const buffer = Number(row.transitionBufferMin)
  return {
    energyStock: Number.isFinite(stock) ? Math.min(16, Math.max(4, Math.round(stock))) : 8,
    burnoutActive: asSpan(row.burnoutActive),
    burnoutHistory: Array.isArray(row.burnoutHistory) ? row.burnoutHistory.map(asSpan).filter((span): span is BurnoutSpan => span != null).slice(-12) : [],
    bodyByDay: row.bodyByDay && typeof row.bodyByDay === 'object' ? row.bodyByDay : {},
    places: Array.isArray(row.places) ? row.places.filter((place) => place && typeof place.slug === 'string').slice(0, 12) : [],
    hereSlug: typeof row.hereSlug === 'string' ? row.hereSlug : null,
    transitionBufferMin: buffer === 10 || buffer === 15 ? buffer : 0,
    impulseEnabled: row.impulseEnabled === true,
    impulseThreshold: Number.isFinite(threshold) ? Math.min(5000, Math.max(1, Math.round(threshold))) : 80,
    holds: Array.isArray(row.holds) ? row.holds.slice(0, 20) : [],
  }
}

type State = Persisted & {
  hydrated: boolean
  hydrate: () => Promise<void>
  setEnergyStock: (stock: number) => void
  startBurnout: (days: 3 | 7) => void
  stopBurnout: () => void
  toggleBody: (id: BodyCheckId) => void
  addPlace: (nome: string) => void
  removePlace: (id: string) => void
  setHere: (slug: string | null) => void
  setTransitionBuffer: (minutes: number) => void
  setImpulseEnabled: (enabled: boolean) => void
  setImpulseThreshold: (threshold: number) => void
  pushHold: (hold: Omit<StoredHold, 'id' | 'liberaEm'>) => void
  removeHold: (id: string) => void
  protectedDates: () => string[]
}

function save(next: Persisted): void
{
  void writeLocalJson(KEY, next)
}

function persist(get: () => State, patch: Partial<Persisted>): void
{
  const merged = normalize({ ...get(), ...patch })
  useCareExtrasStore.setState(merged)
  save(merged)
}

export const useCareExtrasStore = create<State>((set, get) => ({
  ...EMPTY,
  hydrated: false,

  hydrate: async () =>
  {
    if (get().hydrated) return
    const saved = await readLocalJson<unknown>(KEY)
    set({ ...normalize(saved), hydrated: true })
  },

  setEnergyStock: (stock) => persist(get, { energyStock: stock }),

  startBurnout: (days) => persist(get, { burnoutActive: burnoutSpan(localTodayIso(), days) }),

  stopBurnout: () =>
  {
    const active = get().burnoutActive
    persist(get, {
      burnoutActive: null,
      burnoutHistory: active ? [...get().burnoutHistory, active] : get().burnoutHistory,
    })
  },

  toggleBody: (id) =>
  {
    const today = localTodayIso()
    const day = { ...(get().bodyByDay[today] ?? {}) }
    day[id] = !day[id]
    persist(get, { bodyByDay: { ...get().bodyByDay, [today]: day } })
  },

  addPlace: (nome) =>
  {
    const slug = placeSlug(nome)
    if (get().places.some((place) => place.slug === slug)) return
    const place: SavedPlace = {
      id: `lugar-${Date.now().toString(36)}`,
      nome: nome.trim().slice(0, 40),
      slug,
      lat: null,
      lng: null,
    }
    persist(get, { places: [...get().places, place].slice(0, 12) })
  },

  removePlace: (id) => persist(get, { places: get().places.filter((place) => place.id !== id) }),

  setHere: (slug) => persist(get, { hereSlug: slug }),

  setTransitionBuffer: (minutes) => persist(get, { transitionBufferMin: minutes === 10 || minutes === 15 ? minutes : 0 }),

  setImpulseEnabled: (enabled) => persist(get, { impulseEnabled: enabled }),

  setImpulseThreshold: (threshold) => persist(get, { impulseThreshold: threshold }),

  pushHold: (hold) =>
  {
    const next: StoredHold = {
      ...hold,
      id: `espera-${Date.now().toString(36)}`,
      liberaEm: holdReleasesAt(new Date()),
    }
    persist(get, { holds: [...get().holds, next].slice(-20) })
  },

  removeHold: (id) => persist(get, { holds: get().holds.filter((hold) => hold.id !== id) }),

  protectedDates: () => protectedIsoDates(get().burnoutActive, get().burnoutHistory),
}))
