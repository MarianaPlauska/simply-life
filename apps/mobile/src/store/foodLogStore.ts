/**
 * Comida: refeições registradas por texto, preferência de calorias e cache do Open Food Facts.
 * Guarda tudo no aparelho (convidado e offline); com sessão, sobe para `refeicoes` (migração 067)
 * e a nuvem vira a fonte dos últimos meses. Sem a tabela, continua só local, sem erro na tela.
 *
 * Calorias pessoais (migração 068): o valor que a pessoa corrigiu ou leu no código de barras
 * fica guardado por item_key e vence qualquer estimativa. Sem a tabela, fica só no aparelho.
 */
import { create } from 'zustand'
import {
  addDaysIso,
  applyFoodKcal,
  clampItemKcal,
  itemWantsAiKcal,
  localTodayIso,
  type FoodItem,
  type FoodMealType,
  type FoodPersonalKcal,
  type OffProduct,
} from '@simply-life/shared'
import { readPersisted, writePersisted } from '../lib/persistStorage'
import { deleteRefeicao, fetchRefeicoes, upsertRefeicao, type Refeicao } from '../lib/sync/refeicoes'
import { fetchAlimentosPessoais, upsertAlimentosPessoais } from '../lib/sync/alimentosPessoais'
import { estimateKcalWithAi } from '../lib/foodKcalApi'

const MEALS_KEY = 'simply-life-refeicoes-v1'
const PREFS_KEY = 'simply-life-comida-prefs-v1'
const OFF_KEY = 'simply-life-off-cache-v1'
const OFF_CACHE_MAX = 200
const PERSONAL_KEY = 'simply-life-alimentos-pessoais-v1'
/** estimativa em segundo plano só olha as refeições destes últimos dias */
const BACKFILL_DAYS = 14

export type FoodPrefs = {
  /** desligado por padrão */
  mostrarCalorias: boolean
  /** só existe se a pessoa escolher um número */
  metaKcal: number | null
}

export const DEFAULT_FOOD_PREFS: FoodPrefs = { mostrarCalorias: false, metaKcal: null }

export type CachedOffProduct = OffProduct & { fetchedAt: string }

type Stored = { meals: Refeicao[]; deleted: string[] }
type StoredPersonal = { values: Record<string, FoodPersonalKcal>; pending: string[] }

type FoodLogState = {
  owner: string | null
  loaded: boolean
  meals: Refeicao[]
  deleted: string[]
  prefs: FoodPrefs
  offCache: Record<string, CachedOffProduct>
  /** caloria que a pessoa definiu por item_key */
  personal: Record<string, FoodPersonalKcal>
  personalPending: string[]
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
  /** Guarda o valor pessoal do item (correção manual ou código de barras). */
  rememberKcal: (key: string, kcal: number, porcao: string | null) => Promise<void>
  /** Corrige a caloria de um item salvo; também vira valor pessoal. */
  setItemKcal: (mealId: string, index: number, kcal: number) => Promise<void>
  /** Estima o que falta nas refeições recentes (só chamar com "Mostrar calorias" ligado). */
  fillMissingKcal: (opts: { isGuest: boolean }) => Promise<void>
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
let syncAgain = false
let filling = false
/** itens que já foram à IA nesta sessão ("mealId:indice"), para não repetir */
const aiTried = new Set<string>()

/** A porção estimada só existe no aparelho; mantém ao receber a versão da nuvem. */
function keepLocalPorcao(remote: Refeicao, local: Refeicao | undefined): Refeicao
{
  if (!local) return remote
  return {
    ...remote,
    itens: remote.itens.map((it, i) =>
    {
      const l = local.itens[i]
      return l && l.key === it.key && l.porcao && !it.porcao ? { ...it, porcao: l.porcao } : it
    }),
  }
}

export const useFoodLogStore = create<FoodLogState>((set, get) =>
{
  const mealsKey = () => `${MEALS_KEY}:${get().owner ?? 'guest'}`
  const persistMeals = () =>
    writePersisted(mealsKey(), JSON.stringify({ meals: get().meals, deleted: get().deleted } satisfies Stored))

  const personalKey = () => `${PERSONAL_KEY}:${get().owner ?? 'guest'}`
  const persistPersonal = () =>
    writePersisted(personalKey(), JSON.stringify({ values: get().personal, pending: get().personalPending } satisfies StoredPersonal))

  const syncPersonal = async () =>
  {
    const pending = get().personalPending
    if (pending.length)
    {
      const entries = pending
        .map((k) => [k, get().personal[k]] as [string, FoodPersonalKcal | undefined])
        .filter((e): e is [string, FoodPersonalKcal] => Boolean(e[1]))
      if (await upsertAlimentosPessoais(entries))
      {
        set({ personalPending: get().personalPending.filter((k) => !pending.includes(k)) })
      }
    }
    const remote = await fetchAlimentosPessoais()
    if (remote)
    {
      const merged = { ...get().personal }
      for (const [k, v] of Object.entries(remote))
      {
        const cur = merged[k]
        if (!cur || (!get().personalPending.includes(k) && v.updatedAt >= cur.updatedAt)) merged[k] = v
      }
      set({ personal: merged })
    }
    await persistPersonal()
  }

  const sync = async (): Promise<void> =>
  {
    if (get().owner === 'guest' || !get().owner) return
    if (syncing)
    {
      syncAgain = true
      return syncing
    }
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
        // o que mudou aqui e ainda não subiu vence a cópia da nuvem
        const pend = get().meals.filter((m) => m.pendente)
        const pendIds = new Set(pend.map((m) => m.id))
        const byId = new Map(get().meals.map((m) => [m.id, m]))
        const old = get().meals.filter((m) => m.data < since && !m.pendente && !ids.has(m.id))
        const fresh = remote
          .filter((r) => !gone.has(r.id) && !pendIds.has(r.id))
          .map((r) => keepLocalPorcao(r, byId.get(r.id)))
        set({ meals: sortMeals([...fresh, ...pend, ...old]) })
      }
      await persistMeals()
      await syncPersonal()
    })().finally(() =>
    {
      syncing = null
      if (syncAgain)
      {
        syncAgain = false
        void sync()
      }
    })
    return syncing
  }

  /** Troca refeições (marcando para subir de novo) e grava. */
  const replaceMeals = async (changed: Refeicao[]) =>
  {
    if (!changed.length) return
    const pendente = get().owner !== 'guest'
    const byId = new Map(changed.map((m) => [m.id, { ...m, pendente: pendente || m.pendente }]))
    set({ meals: get().meals.map((m) => byId.get(m.id) ?? m) })
    await persistMeals()
    void sync()
  }

  return {
    owner: null,
    loaded: false,
    meals: [],
    deleted: [],
    prefs: DEFAULT_FOOD_PREFS,
    offCache: {},
    personal: {},
    personalPending: [],

    hydrate: async ({ userId, isGuest }) =>
    {
      const owner = isGuest || !userId ? 'guest' : userId
      if (get().loaded && get().owner === owner)
      {
        void sync()
        return
      }
      set({ owner })
      const [mealsRaw, prefsRaw, offRaw, personalRaw] = await Promise.all([
        readPersisted(mealsKey()),
        readPersisted(PREFS_KEY),
        readPersisted(OFF_KEY),
        readPersisted(personalKey()),
      ])
      const stored = parseJson<Stored>(mealsRaw, { meals: [], deleted: [] })
      const storedPersonal = parseJson<StoredPersonal>(personalRaw, { values: {}, pending: [] })
      set({
        meals: sortMeals(Array.isArray(stored.meals) ? stored.meals : []),
        deleted: Array.isArray(stored.deleted) ? stored.deleted : [],
        prefs: { ...DEFAULT_FOOD_PREFS, ...parseJson<Partial<FoodPrefs>>(prefsRaw, {}) },
        offCache: parseJson<Record<string, CachedOffProduct>>(offRaw, {}),
        personal: storedPersonal.values && typeof storedPersonal.values === 'object' ? storedPersonal.values : {},
        personalPending: Array.isArray(storedPersonal.pending) ? storedPersonal.pending : [],
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

    rememberKcal: async (key, kcal, porcao) =>
    {
      const v = clampItemKcal(kcal)
      if (!key || v == null) return
      set({
        personal: { ...get().personal, [key]: { kcal: v, porcao: porcao?.trim() || null, updatedAt: new Date().toISOString() } },
        personalPending: get().owner === 'guest' || get().personalPending.includes(key)
          ? get().personalPending
          : [...get().personalPending, key],
      })
      await persistPersonal()
      void sync()
    },

    setItemKcal: async (mealId, index, kcal) =>
    {
      const v = clampItemKcal(kcal)
      const meal = get().meals.find((m) => m.id === mealId)
      const it = meal?.itens[index]
      if (!meal || !it || v == null) return
      const itens = meal.itens.map((x, i) => (i === index ? { ...x, kcal: v, fonte: 'manual' } : x))
      await replaceMeals([{ ...meal, itens }])
      await get().rememberKcal(it.key, v, it.quantidade ?? it.porcao ?? null)
    },

    fillMissingKcal: async ({ isGuest }) =>
    {
      if (filling || !get().loaded) return
      filling = true
      try
      {
        const since = addDaysIso(localTodayIso(), -BACKFILL_DAYS)
        // 1. na hora: valor pessoal e tabela local
        const quick = get().meals
          .filter((m) => m.data >= since)
          .map((m) => ({ m, itens: applyFoodKcal(m.itens, { personal: get().personal }) }))
          .filter(({ m, itens }) => itens.some((it, i) => it !== m.itens[i]))
          .map(({ m, itens }) => ({ ...m, itens }))
        await replaceMeals(quick)

        // 2. IA para o que ficou sem dado ou só com a tabela local
        if (isGuest || get().owner === 'guest') return
        const byTipo = new Map<FoodMealType, { mealId: string; index: number; item: FoodItem }[]>()
        for (const m of get().meals.filter((x) => x.data >= since))
        {
          m.itens.forEach((item, index) =>
          {
            const tag = `${m.id}:${index}`
            if (aiTried.has(tag) || !itemWantsAiKcal(item) || get().personal[item.key]) return
            aiTried.add(tag)
            const list = byTipo.get(m.tipo) ?? []
            list.push({ mealId: m.id, index, item })
            byTipo.set(m.tipo, list)
          })
        }
        for (const [tipo, list] of byTipo)
        {
          const ai = await estimateKcalWithAi(list.map((l) => l.item), tipo)
          const changed = new Map<string, Refeicao>()
          list.forEach((l, i) =>
          {
            const cand = ai[i]
            if (!cand) return
            const meal = changed.get(l.mealId) ?? get().meals.find((m) => m.id === l.mealId)
            const cur = meal?.itens[l.index]
            if (!meal || !cur || cur.key !== l.item.key) return
            const next = applyFoodKcal([cur], { personal: get().personal, ai: [cand], useLocal: false })[0]
            if (next === cur) return
            const itens = [...meal.itens]
            itens[l.index] = next
            changed.set(l.mealId, { ...meal, itens })
          })
          await replaceMeals([...changed.values()])
        }
      }
      finally
      {
        filling = false
      }
    },
  }
})
