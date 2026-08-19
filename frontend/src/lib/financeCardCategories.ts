// Categorias por cartão — nomes e ícones Lucide próprios do extrato

import { readScopedJson, writeScopedJson } from './userScopedStorage'

export interface CardCategory
{
  id: string
  nome: string
  icone: string
}

const STORAGE_PREFIX = 'simply-life:card-categories:'

function storageKey(cardId: string): string
{
  return `${STORAGE_PREFIX}${cardId}`
}

const DEFAULT_CATEGORIES: CardCategory[] = [
  { id: 'alimentacao', nome: 'Alimentação', icone: 'Utensils' },
  { id: 'mercado', nome: 'Mercado', icone: 'ShoppingCart' },
  { id: 'transporte', nome: 'Transporte', icone: 'Car' },
  { id: 'saude', nome: 'Saúde', icone: 'Pill' },
  { id: 'lazer', nome: 'Lazer', icone: 'Film' },
  { id: 'outros', nome: 'Outros', icone: 'Receipt' },
]

const EMOJI_TO_ICONE: Record<string, string> = {
  '🍽️': 'Utensils',
  '🛒': 'ShoppingCart',
  '🚗': 'Car',
  '💊': 'Pill',
  '🎬': 'Film',
  '✏️': 'Receipt',
  '🏷️': 'Wallet',
}

function normalizeCategory(raw: Partial<CardCategory> & { emoji?: string }): CardCategory
{
  const icone = raw.icone?.trim()
    || (raw.emoji ? EMOJI_TO_ICONE[raw.emoji.trim()] : undefined)
    || 'Wallet'
  return {
    id: raw.id ?? `cat-${Date.now()}`,
    nome: raw.nome?.trim() || 'Nova',
    icone,
  }
}

export function loadCardCategories(cardId: string): CardCategory[]
{
  const saved = readScopedJson<Array<Partial<CardCategory> & { emoji?: string }>>(storageKey(cardId))
  if (saved && saved.length > 0)
  {
    return saved.map(normalizeCategory)
  }
  return DEFAULT_CATEGORIES.map((c) => ({ ...c }))
}

export function saveCardCategories(cardId: string, categorias: CardCategory[]): void
{
  writeScopedJson(storageKey(cardId), categorias)
}

export function upsertCardCategory(
  cardId: string,
  patch: Partial<CardCategory> & { id?: string },
): CardCategory[]
{
  const lista = loadCardCategories(cardId)
  const id = patch.id ?? `cat-${Date.now()}`
  const idx = lista.findIndex((c) => c.id === id)
  const next = normalizeCategory({
    ...lista[idx],
    ...patch,
    id,
  })
  if (idx >= 0)
  {
    lista[idx] = next
  }
  else
  {
    lista.push(next)
  }
  saveCardCategories(cardId, lista)
  return lista
}

export function removeCardCategory(cardId: string, categoryId: string): CardCategory[]
{
  const lista = loadCardCategories(cardId).filter((c) => c.id !== categoryId)
  saveCardCategories(cardId, lista.length > 0 ? lista : DEFAULT_CATEGORIES.map((c) => ({ ...c })))
  return loadCardCategories(cardId)
}

export function labelCardCategory(cardId: string, categoryId: string): string
{
  const cat = loadCardCategories(cardId).find((c) => c.id === categoryId)
  return cat?.nome ?? categoryId
}

/** Nome puro — sem emoji legado */
export function cardCategoryNome(cat: CardCategory | undefined): string
{
  return cat?.nome?.trim() || 'Outros'
}
