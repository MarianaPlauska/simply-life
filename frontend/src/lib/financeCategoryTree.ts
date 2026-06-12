import type { Category } from '../store/storeTypes'
import { dedupeCategories } from './financeCategoryDedupe'

export function getTopLevelCategories(categories: Category[], tipo?: 'receita' | 'despesa'): Category[]
{
  const unique = dedupeCategories(categories)
  return unique.filter((c) =>
  {
    if (c.parent_id != null) return false
    if (tipo && c.tipo !== tipo) return false
    return true
  })
}

export function getSubcategories(categories: Category[], parentId: number): Category[]
{
  return dedupeCategories(categories).filter((c) => c.parent_id === parentId)
}

export function findCategory(categories: Category[], id: number | undefined): Category | undefined
{
  if (id == null) return undefined
  return categories.find((c) => c.id === id)
}

/** Rótulo para exibição — "Alimentação › Aniversário" */
export function formatCategoryPath(categories: Category[], categoryId: number | undefined): string
{
  if (categoryId == null) return '—'
  const cat = findCategory(categories, categoryId)
  if (!cat) return '—'
  if (cat.parent_id == null) return cat.nome
  const parent = findCategory(categories, cat.parent_id)
  return parent ? `${parent.nome} › ${cat.nome}` : cat.nome
}

/** Agrupa gastos na categoria pai para gráficos */
export function resolveRollupCategoryId(categories: Category[], categoryId: number | undefined): number | undefined
{
  if (categoryId == null) return undefined
  const cat = findCategory(categories, categoryId)
  if (!cat) return categoryId
  return cat.parent_id ?? cat.id
}
