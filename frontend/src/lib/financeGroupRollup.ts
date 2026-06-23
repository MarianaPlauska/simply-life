import { CATEGORY_GRUPO_LABELS, CATEGORY_GRUPO_ORDER } from './financeDefaultCategories'
import type { Category, CategoryGrupo, Transaction } from '../store/storeTypes'

const GRUPO_ORDER = CATEGORY_GRUPO_ORDER

export interface GrupoCategoryLine
{
  id: number
  nome: string
  total: number
}

export interface GrupoRollupRow
{
  grupo: CategoryGrupo
  label: string
  receita: number
  despesa: number
  saldo: number
  count: number
  categorias: GrupoCategoryLine[]
}

function resolveGrupo(t: Transaction, categories: Category[]): CategoryGrupo
{
  if (t.categoria_id)
  {
    const cat = categories.find((c) => c.id === t.categoria_id)
    if (cat?.grupo) return cat.grupo
  }

  const byName = categories.find((c) => c.nome === t.categoria)
  return byName?.grupo ?? 'geral'
}

function resolveCategoryId(t: Transaction, categories: Category[]): number | null
{
  if (t.categoria_id) return t.categoria_id
  const cat = categories.find((c) => c.nome === t.categoria)
  return cat?.id ?? null
}

/** Totais por grupo Casa / Contas / Futuro / Geral */
export function buildGrupoRollup(
  transactions: Transaction[],
  categories: Category[],
): GrupoRollupRow[]
{
  const buckets = new Map<CategoryGrupo, {
    receita: number
    despesa: number
    count: number
    catMap: Map<number, { nome: string; total: number }>
  }>()

  for (const grupo of GRUPO_ORDER)
  {
    buckets.set(grupo, { receita: 0, despesa: 0, count: 0, catMap: new Map() })
  }

  for (const t of transactions)
  {
    const grupo = resolveGrupo(t, categories)
    const bucket = buckets.get(grupo)!
    bucket.count += 1

    if (t.tipo === 'receita')
    {
      bucket.receita += t.valor
    }
    else if (t.tipo === 'despesa' || t.tipo === 'investimento')
    {
      bucket.despesa += t.valor
    }

    const catId = resolveCategoryId(t, categories)
    if (catId != null && t.tipo === 'despesa')
    {
      const nome = categories.find((c) => c.id === catId)?.nome ?? t.categoria
      const prev = bucket.catMap.get(catId) ?? { nome, total: 0 }
      bucket.catMap.set(catId, { nome, total: prev.total + t.valor })
    }
  }

  return GRUPO_ORDER.map((grupo) =>
  {
    const b = buckets.get(grupo)!
    const categorias = Array.from(b.catMap.entries())
      .map(([id, v]) => ({ id, nome: v.nome, total: v.total }))
      .sort((a, b) => b.total - a.total)

    return {
      grupo,
      label: CATEGORY_GRUPO_LABELS[grupo],
      receita: b.receita,
      despesa: b.despesa,
      saldo: b.receita - b.despesa,
      count: b.count,
      categorias,
    }
  }).filter((r) => r.count > 0 || r.categorias.length > 0)
}

export function filterTransactionsByGrupo(
  transactions: Transaction[],
  categories: Category[],
  grupo: CategoryGrupo | 'all',
): Transaction[]
{
  if (grupo === 'all') return transactions

  return transactions.filter((t) => resolveGrupo(t, categories) === grupo)
}

export { GRUPO_ORDER }
