import { readScopedJson, writeScopedJson } from './userScopedStorage'

const BASE_KEY = 'simply-life:card-category-pins'

function storageKey(cardId: string): string
{
  return `${BASE_KEY}:${cardId}`
}

export function getPinnedCardCategoryIds(cardId: string): string[]
{
  const raw = readScopedJson<string[]>(storageKey(cardId))
  return Array.isArray(raw) ? [...raw] : []
}

export function pinCardCategory(cardId: string, categoryId: string): string[]
{
  const list = getPinnedCardCategoryIds(cardId)
  if (!list.includes(categoryId))
  {
    list.push(categoryId)
    writeScopedJson(storageKey(cardId), list)
  }
  return [...list]
}

export function unpinCardCategory(cardId: string, categoryId: string): string[]
{
  const next = getPinnedCardCategoryIds(cardId).filter((id) => id !== categoryId)
  writeScopedJson(storageKey(cardId), next)
  return next
}

export function isCardCategoryPinned(cardId: string, categoryId: string): boolean
{
  return getPinnedCardCategoryIds(cardId).includes(categoryId)
}

/** Primeira vez: fixa todas as categorias padrão como atalhos */
export function seedDefaultCardCategoryPins(cardId: string, categoryIds: string[]): void
{
  const current = getPinnedCardCategoryIds(cardId)
  if (current.length > 0) return
  writeScopedJson(storageKey(cardId), [...categoryIds])
}
