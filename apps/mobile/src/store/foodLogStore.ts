/**
 * Comida: refeições registradas por texto, preferência de calorias e cache do Open Food Facts.
 * Guarda tudo no aparelho (convidado e offline); com sessão, sobe para `refeicoes` (migração 067)
 * e a nuvem vira a fonte dos últimos meses. Sem a tabela, continua só local, sem erro na tela.
 *
 * Calorias pessoais (migração 068): o valor que a pessoa corrigiu ou leu no código de barras
 * fica guardado por item_key e vence qualquer estimativa. Sem a tabela, fica só no aparelho.
 * Proteína e açúcar (migração 077) andam junto com a caloria, da mesma fonte.
 *
 * Proteína no hábito: com "Mostrar calorias e nutrientes" ligado, a proteína de cada refeição
 * soma no hábito "proteina" do dia da refeição. Guarda por refeição quanto já entrou e manda
 * só a diferença (apagar a refeição tira). Quem muda a refeição neste aparelho é quem soma;
 * a cópia que chega da nuvem só atualiza a conta, para não somar duas vezes em dois aparelhos.
 */
import { create } from 'zustand'
import {
  addDaysIso,
  applyFoodKcal,
  clampItemKcal,
  itemWantsAiKcal,
  clampItemGrams,
  localTodayIso,
  mealProteinGrams,
  offProductHasNutrients,
  type FoodItem,
  type FoodMealType,
  type FoodPersonalKcal,
  type OffProduct,
} from '@simply-life/shared'
import { readPersisted, writePersisted } from '../lib/persistStorage'
import { deleteRefeicao, fetchRefeicoes, upsertRefeicao, type Refeicao } from '../lib/sync/refeicoes'
import { fetchAlimentosPessoais, upsertAlimentosPessoais } from '../lib/sync/alimentosPessoais'
import { estimateKcalWithAi } from '../lib/foodKcalApi'
import { addMealProteinToHabit } from '../lib/mealProtein'
import { useActivityStore } from './activityStore'

const MEALS_KEY = 'simply-life-refeicoes-v1'
const PREFS_KEY = 'simply-life-comida-prefs-v1'
const OFF_KEY = 'simply-life-off-cache-v1'
const OFF_CACHE_MAX = 200
const PERSONAL_KEY = 'simply-life-alimentos-pessoais-v1'
/** gramas de proteína de cada refeição que já entraram no hábito */
const PROTEIN_KEY = 'simply-life-refeicoes-proteina-v1'
/** estimativa em segundo plano só olha as refeições destes últimos dias */
const BACKFILL_DAYS = 14

export type FoodPrefs = {
  /** "Mostrar calorias e nutrientes"; desligado por padrão (nome antigo mantido no aparelho) */
  mostrarCalorias: boolean
  /** só existe se a pessoa escolher um número */
  metaKcal: number | null
  /** gramas por dia; null usa a meta do hábito de proteína */
  metaProteina: number | null
  /** limite de açúcar em gramas por dia; só se a pessoa quiser */
  metaAcucar: number | null
}

export const DEFAULT_FOOD_PREFS: FoodPrefs = { mostrarCalorias: false, metaKcal: null, metaProteina: null, metaAcucar: null }

/** Proteína e açúcar opcionais ao corrigir ou lembrar um item. undefined mantém o que havia. */
export type FoodNutrientPatch = { proteina?: number | null; acucar?: number | null }

type ProteinApplied = Record<string, { data: string; g: number }>

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
  /** proteína de cada refeição que já entrou no hábito (por id) */
  proteinApplied: ProteinApplied
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
  rememberKcal: (key: string, kcal: number, porcao: string | null, nutrients?: FoodNutrientPatch) => Promise<void>
  /** Corrige caloria (e proteína/açúcar, se vierem) de um item salvo; também vira valor pessoal. */
  setItemKcal: (mealId: string, index: number, kcal: number, nutrients?: FoodNutrientPatch) => Promise<void>
  /** Soma no hábito de proteína o que falta das refeições recentes (idempotente). */
  syncMealProtein: () => Promise<void>
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

/** só as refeições destes últimos dias mexem no hábito de proteína */
const PROTEIN_DAYS = 14
let proteinRunning: Promise<void> | null = null
let proteinAgain = false

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

  const proteinKey = () => `${PROTEIN_KEY}:${get().owner ?? 'guest'}`
  const persistProtein = () => writePersisted(proteinKey(), JSON.stringify(get().proteinApplied))

  /** Leva ao hábito a diferença entre a proteína atual de cada refeição e o que já entrou. */
  const syncMealProtein = async (): Promise<void> =>
  {
    if (proteinRunning)
    {
      proteinAgain = true
      return proteinRunning
    }
    proteinRunning = (async () =>
    {
      if (!get().loaded || !get().prefs.mostrarCalorias) return
      const isGuest = get().owner === 'guest'
      const since = addDaysIso(localTodayIso(), -PROTEIN_DAYS)
      let changed = false
      for (const m of get().meals)
      {
        if (m.data < since) continue
        const target = mealProteinGrams(m)
        const prev = get().proteinApplied[m.id]
        const delta = target - (prev?.g ?? 0)
        if (Math.abs(delta) < 0.05) continue
        if (!(await addMealProteinToHabit(m.data, delta, isGuest))) continue
        set({ proteinApplied: { ...get().proteinApplied, [m.id]: { data: m.data, g: target } } })
        changed = true
      }
      if (changed) await persistProtein()
    })().finally(() =>
    {
      proteinRunning = null
      if (proteinAgain)
      {
        proteinAgain = false
        void syncMealProtein()
      }
    })
    return proteinRunning
  }

  /** Refeição que veio da nuvem: quem mudou lá já somou; aqui só acerta a conta. */
  const rebaselineProtein = (remote: Refeicao[]) =>
  {
    const next = { ...get().proteinApplied }
    let changed = false
    for (const r of remote)
    {
      const g = mealProteinGrams(r)
      const cur = next[r.id]
      if (cur && cur.g === g && cur.data === r.data) continue
      if (!cur && g === 0) continue
      next[r.id] = { data: r.data, g }
      changed = true
    }
    if (changed) set({ proteinApplied: next })
    return changed
  }

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
        if (rebaselineProtein(fresh)) await persistProtein()
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
    void syncMealProtein()
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
    proteinApplied: {},
    syncMealProtein,

    hydrate: async ({ userId, isGuest }) =>
    {
      const owner = isGuest || !userId ? 'guest' : userId
      if (get().loaded && get().owner === owner)
      {
        void sync()
        return
      }
      set({ owner })
      const [mealsRaw, prefsRaw, offRaw, personalRaw, proteinRaw] = await Promise.all([
        readPersisted(mealsKey()),
        readPersisted(PREFS_KEY),
        readPersisted(OFF_KEY),
        readPersisted(personalKey()),
        readPersisted(proteinKey()),
      ])
      // produto guardado antes de proteína e açúcar existirem é buscado de novo
      const offAll = parseJson<Record<string, CachedOffProduct>>(offRaw, {})
      const offCache = Object.fromEntries(Object.entries(offAll).filter(([, p]) => offProductHasNutrients(p)))
      const proteinApplied = parseJson<ProteinApplied>(proteinRaw, {})
      const stored = parseJson<Stored>(mealsRaw, { meals: [], deleted: [] })
      const storedPersonal = parseJson<StoredPersonal>(personalRaw, { values: {}, pending: [] })
      set({
        meals: sortMeals(Array.isArray(stored.meals) ? stored.meals : []),
        deleted: Array.isArray(stored.deleted) ? stored.deleted : [],
        prefs: { ...DEFAULT_FOOD_PREFS, ...parseJson<Partial<FoodPrefs>>(prefsRaw, {}) },
        offCache,
        proteinApplied: proteinApplied && typeof proteinApplied === 'object' ? proteinApplied : {},
        personal: storedPersonal.values && typeof storedPersonal.values === 'object' ? storedPersonal.values : {},
        personalPending: Array.isArray(storedPersonal.pending) ? storedPersonal.pending : [],
        loaded: true,
      })
      void sync()
      void syncMealProtein()
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
      try
      {
        useActivityStore.getState().markAction('meal', input.data)
      }
      catch
      {
        // a ofensiva não pode atrapalhar o registro
      }
      void syncMealProtein()
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
      // a proteína que essa refeição tinha levado ao hábito sai de lá
      const applied = get().proteinApplied[id]
      if (applied)
      {
        const ok = applied.g === 0 || await addMealProteinToHabit(applied.data, -applied.g, get().owner === 'guest')
        if (ok)
        {
          const next = { ...get().proteinApplied }
          delete next[id]
          set({ proteinApplied: next })
          await persistProtein()
        }
      }
      void sync()
    },

    setPrefs: async (patch) =>
    {
      const prefs = { ...get().prefs, ...patch }
      set({ prefs })
      await writePersisted(PREFS_KEY, JSON.stringify(prefs))
      if (patch.mostrarCalorias) void syncMealProtein()
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

    rememberKcal: async (key, kcal, porcao, nutrients) =>
    {
      const v = clampItemKcal(kcal)
      if (!key || v == null) return
      const prev = get().personal[key]
      const proteina = nutrients && 'proteina' in nutrients ? clampItemGrams(nutrients.proteina) : prev?.proteina ?? null
      const acucar = nutrients && 'acucar' in nutrients ? clampItemGrams(nutrients.acucar) : prev?.acucar ?? null
      set({
        personal: {
          ...get().personal,
          [key]: { kcal: v, proteina, acucar, porcao: porcao?.trim() || null, updatedAt: new Date().toISOString() },
        },
        personalPending: get().owner === 'guest' || get().personalPending.includes(key)
          ? get().personalPending
          : [...get().personalPending, key],
      })
      await persistPersonal()
      void sync()
    },

    setItemKcal: async (mealId, index, kcal, nutrients) =>
    {
      const v = clampItemKcal(kcal)
      const meal = get().meals.find((m) => m.id === mealId)
      const it = meal?.itens[index]
      if (!meal || !it || v == null) return
      // o que a pessoa não mexeu continua o que estava (manual vale para os três números)
      const proteina = nutrients && 'proteina' in nutrients ? clampItemGrams(nutrients.proteina) : it.proteina ?? null
      const acucar = nutrients && 'acucar' in nutrients ? clampItemGrams(nutrients.acucar) : it.acucar ?? null
      const itens = meal.itens.map((x, i) => (i === index ? { ...x, kcal: v, proteina, acucar, fonte: 'manual', fontes: null } : x))
      await replaceMeals([{ ...meal, itens }])
      await get().rememberKcal(it.key, v, it.quantidade ?? it.porcao ?? null, { proteina, acucar })
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
