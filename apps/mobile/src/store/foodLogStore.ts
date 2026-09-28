/**
 * Comida: refeições registradas por texto, preferência de calorias e cache do Open Food Facts.
 * Guarda tudo no aparelho (convidado e offline); com sessão, sobe para `refeicoes` (migração 067)
 * e a nuvem vira a fonte dos últimos meses. Sem a tabela, continua só local, sem erro na tela.
 */
import { create } from 'zustand'
import { localTodayIso, type FoodItem, type FoodMealType, type OffProduct } from '@simply-life/shared'
import { readPersisted, writePersisted } from '../lib/persistStorage'
import { deleteRefeicao, fetchRefeicoes, upsertRefeicao, type Refeicao } from '../lib/sync/refeicoes'

const MEALS_KEY = 'simply-life-refeicoes-v1'
const PREFS_KEY = 'simply-life-comida-prefs-v1'
const OFF_KEY = 'simply-life-off-cache-v1'
const OFF_CACHE_MAX = 200

export type FoodPrefs = {
  /** desligado por padrão */
  mostrarCalorias: boolean
  /** só existe se a pessoa escolher um número */
  metaKcal: number | null
}

export const DEFAULT_FOOD_PREFS: FoodPrefs = { mostrarCalorias: false, metaKcal: null }

export type CachedOffProduct = OffProduct & { fetchedAt: string }

type Stored = { meals: Refeicao[]; deleted: string[] }

type FoodLogState = {
  owner: string | null
  loaded: boolean
  meals: Refeicao[]
  deleted: string[]
  prefs: FoodPrefs
  offCache: Record<string, CachedOffProduct>
  hydrate: (opts: { userId: string | null; isGuest: boolean }) => Promise<void>
  addMeal: (input: {
    data: string
    hora: string | null
    tipo: FoodMealType
    texto: string
    itens: FoodItem[]
  }) => Promise<Refeicao>
  removeMeal: (id: string) => Promise<void>
  setPrefs: (patch: Partial<FoodPrefs>) => Promise<void>
  cacheProduct: (p: OffProduct) => void
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

function sortMeals(list: Refeicao[]): Refeicao[]
{
  return [...list].sort((a, b) =>
    b.data.localeCompare(a.data) || (b.hora ?? '').localeCompare(a.hora ?? '') || b.createdAt.localeCompare(a.createdAt))
}

function parseJson<T>(raw: string | null, fallback: T): T
{
  if (!raw) return fallback
  try
  {
    return JSON.parse(raw) as T
  }
  catch
  {
    return fallback
  }
}

/** Primeiro dia de dois meses atrás: cobre o mês atual e a comparação com o anterior. */
function syncSince(): string
{
  const d = new Date()
  const first = new Date(d.getFullYear(), d.getMonth() - 2, 1, 12)
  return localTodayIso(first)
}

let syncing: Promise<void> | null = null

export const useFoodLogStore = create<FoodLogState>((set, get) =>
{
  const mealsKey = () => `${MEALS_KEY}:${get().owner ?? 'guest'}`
  const persistMeals = () =>
    writePersisted(mealsKey(), JSON.stringify({ meals: get().meals, deleted: get().deleted } satisfies Stored))

  const sync = async () =>
  {
    if (get().owner === 'guest' || !get().owner) return
    if (syncing) return syncing
    syncing = (async () =>
    {
      for (const id of get().deleted)
      {
        if (await deleteRefeicao(id)) set({ deleted: get().deleted.filter((d) => d !== id) })
      }
      for (const m of get().meals.filter((x) => x.pendente))
      {
        if (await upsertRefeicao(m))
        {
          set({ meals: get().meals.map((x) => (x.id === m.id ? { ...x, pendente: false } : x)) })
        }
      }
      const since = syncSince()
      const remote = await fetchRefeicoes(since)
      if (remote)
      {
        const ids = new Set(remote.map((r) => r.id))
        const gone = new Set(get().deleted)
        const pend = get().meals.filter((m) => m.pendente && !ids.has(m.id))
        const old = get().meals.filter((m) => m.data < since && !m.pendente && !ids.has(m.id))
        set({ meals: sortMeals([...remote.filter((r) => !gone.has(r.id)), ...pend, ...old]) })
      }
      await persistMeals()
    })().finally(() =>
    {
      syncing = null
    })
    return syncing
  }

  return {
    owner: null,
    loaded: false,
    meals: [],
    deleted: [],
    prefs: DEFAULT_FOOD_PREFS,
    offCache: {},

    hydrate: async ({ userId, isGuest }) =>
    {
      const owner = isGuest || !userId ? 'guest' : userId
      if (get().loaded && get().owner === owner)
      {
        void sync()
        return
      }
      set({ owner })
      const [mealsRaw, prefsRaw, offRaw] = await Promise.all([
        readPersisted(mealsKey()),
        readPersisted(PREFS_KEY),
        readPersisted(OFF_KEY),
      ])
      const stored = parseJson<Stored>(mealsRaw, { meals: [], deleted: [] })
      set({
        meals: sortMeals(Array.isArray(stored.meals) ? stored.meals : []),
        deleted: Array.isArray(stored.deleted) ? stored.deleted : [],
        prefs: { ...DEFAULT_FOOD_PREFS, ...parseJson<Partial<FoodPrefs>>(prefsRaw, {}) },
        offCache: parseJson<Record<string, CachedOffProduct>>(offRaw, {}),
        loaded: true,
      })
      void sync()
    },

    addMeal: async (input) =>
    {
      const meal: Refeicao = {
        id: newId(),
        data: input.data,
        hora: input.hora,
        tipo: input.tipo,
        texto: input.texto,
        itens: input.itens,
        createdAt: new Date().toISOString(),
        pendente: get().owner !== 'guest',
      }
      set({ meals: sortMeals([meal, ...get().meals]) })
      await persistMeals()
      void sync()
      return meal
    },

    removeMeal: async (id) =>
    {
      const meal = get().meals.find((m) => m.id === id)
      set({
        meals: get().meals.filter((m) => m.id !== id),
        // o que nunca subiu não precisa ser apagado na nuvem
        deleted: meal && get().owner !== 'guest' && !meal.pendente ? [...get().deleted, id] : get().deleted,
      })
      await persistMeals()
      void sync()
    },

    setPrefs: async (patch) =>
    {
      const prefs = { ...get().prefs, ...patch }
      set({ prefs })
      await writePersisted(PREFS_KEY, JSON.stringify(prefs))
    },

    cacheProduct: (p) =>
    {
      const entries = Object.entries({ ...get().offCache, [p.barcode]: { ...p, fetchedAt: new Date().toISOString() } })
        .sort((a, b) => b[1].fetchedAt.localeCompare(a[1].fetchedAt))
        .slice(0, OFF_CACHE_MAX)
      const offCache = Object.fromEntries(entries)
      set({ offCache })
      void writePersisted(OFF_KEY, JSON.stringify(offCache))
    },
  }
})
