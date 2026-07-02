import type { Category } from '../store/storeTypes'
import { readScopedJson, writeScopedJson } from './userScopedStorage'

const BASE_KEY = 'simply-life:finance-category-pins'

interface PinStore
{
  receita: number[]
  despesa: number[]
}

function emptyStore(): PinStore
{
  return { receita: [], despesa: [] }
}

function loadStore(): PinStore
{
  const raw = readScopedJson<PinStore>(BASE_KEY)
  if (!raw)
  {
    return emptyStore()
  }
  return {
    receita: Array.isArray(raw.receita) ? [...raw.receita] : [],
    despesa: Array.isArray(raw.despesa) ? [...raw.despesa] : [],
  }
}

function saveStore(store: PinStore): void
{
  writeScopedJson(BASE_KEY, store)
}

export function getPinnedCategoryIds(tipo: 'receita' | 'despesa'): number[]
{
  return loadStore()[tipo]
}

export function isCategoryPinned(id: number, tipo: 'receita' | 'despesa'): boolean
{
  return getPinnedCategoryIds(tipo).includes(id)
}

export function pinCategory(id: number, tipo: 'receita' | 'despesa'): number[]
{
  const store = loadStore()
  const list = store[tipo]
  if (!list.includes(id))
  {
    list.push(id)
    saveStore(store)
  }
  return [...list]
}

export function unpinCategory(id: number, tipo: 'receita' | 'despesa'): number[]
{
  const store = loadStore()
  store[tipo] = store[tipo].filter((x) => x !== id)
  saveStore(store)
  return [...store[tipo]]
}

/** Primeira vez: Salário e Freelance nos atalhos de receita */
export function seedDefaultCategoryPins(categories: Category[]): void
{
  const store = loadStore()
  let changed = false

  if (store.receita.length === 0)
  {
    for (const nome of ['Salário', 'Freelance'])
    {
      const cat = categories.find(
        (c) => c.tipo === 'receita' && c.parent_id == null && c.nome === nome,
      )
      if (cat && !store.receita.includes(cat.id))
      {
        store.receita.push(cat.id)
        changed = true
      }
    }
  }

  if (changed)
  {
    saveStore(store)
  }
}

export function prunePinnedCategories(existingIds: Set<number>): void
{
  const store = loadStore()
  const next: PinStore = {
    receita: store.receita.filter((id) => existingIds.has(id)),
    despesa: store.despesa.filter((id) => existingIds.has(id)),
  }
  if (
    next.receita.length !== store.receita.length
    || next.despesa.length !== store.despesa.length
  )
  {
    saveStore(next)
  }
}
