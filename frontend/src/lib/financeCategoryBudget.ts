import type { BudgetLimit, Category, Transaction } from '../store/storeTypes'
import { resolveRollupCategoryId } from './financeCategoryTree'

export type BudgetAlertLevel = 'ok' | 'caution' | 'over'

export interface CategoryBudgetRow
{
  id: number
  nome: string
  icone: string
  cor: string
  grupo?: Category['grupo']
  gasto: number
  limite: number
  pct: number
  alert: BudgetAlertLevel
  restante: number
}

export function budgetAlertLevel(pct: number): BudgetAlertLevel
{
  if (pct >= 100) return 'over'
  if (pct >= 80) return 'caution'
  return 'ok'
}

export function budgetAlertLabel(level: BudgetAlertLevel): string
{
  if (level === 'over') return 'Estourou'
  if (level === 'caution') return 'Atenção'
  return 'No limite'
}

export interface BudgetRemainingDisplay
{
  primary: string
  secondary: string
  tone: string
}

/** Hero + legenda — valor restante em destaque */
export function budgetRemainingDisplay(
  row: CategoryBudgetRow,
  fmt: (v: number) => string,
): BudgetRemainingDisplay
{
  if (row.limite <= 0)
  {
    return {
      primary: fmt(row.gasto),
      secondary: 'sem limite definido',
      tone: 'text-ink-muted',
    }
  }

  if (row.alert === 'over')
  {
    return {
      primary: `Estourou ${fmt(row.gasto - row.limite)}`,
      secondary: `${fmt(row.gasto)} de ${fmt(row.limite)}`,
      tone: 'text-urgente',
    }
  }

  return {
    primary: `${fmt(row.restante)} restantes`,
    secondary: `${fmt(row.gasto)} de ${fmt(row.limite)}`,
    tone: row.alert === 'caution' ? 'text-atencao' : 'text-finance',
  }
}

/** Soma do que ainda cabe nas categorias com teto */
export function totalBudgetRemaining(rows: CategoryBudgetRow[]): number
{
  return rows
    .filter((r) => r.limite > 0)
    .reduce((sum, r) => sum + r.restante, 0)
}

/** Gasto do mês na categoria (inclui subcategorias no pai) */
export function sumCategorySpend(
  monthTx: Transaction[],
  categoryId: number,
  categories: Category[],
): number
{
  const childIds = new Set(
    categories.filter((c) => c.parent_id === categoryId).map((c) => c.id),
  )
  childIds.add(categoryId)

  return monthTx
    .filter((t) => t.tipo === 'despesa' && t.categoria_id != null && childIds.has(t.categoria_id))
    .reduce((s, t) => s + t.valor, 0)
}

export function buildCategoryBudgetRows(
  categories: Category[],
  budgetLimits: BudgetLimit[],
  monthTx: Transaction[],
): CategoryBudgetRow[]
{
  const parents = categories.filter((c) => c.tipo === 'despesa' && c.parent_id == null)

  return parents.map((cat) =>
  {
    const limitObj = budgetLimits.find((b) => b.categoria_id === cat.id)
    const limite = limitObj?.limite ?? 0
    const gasto = sumCategorySpend(monthTx, cat.id, categories)
    const pct = limite > 0 ? (gasto / limite) * 100 : 0

    return {
      id: cat.id,
      nome: cat.nome,
      icone: cat.icone,
      cor: cat.cor,
      grupo: cat.grupo,
      gasto,
      limite,
      pct,
      alert: budgetAlertLevel(pct),
      restante: Math.max(0, limite - gasto),
    }
  })
}

export function filterActiveBudgetRows(rows: CategoryBudgetRow[]): CategoryBudgetRow[]
{
  return rows
    .filter((r) => r.limite > 0 || r.gasto > 0)
    .sort((a, b) => b.pct - a.pct)
}

/** Categoria com teto e maior % usada — o envelope que mais aperta */
export function worstBudgetEnvelope(rows: CategoryBudgetRow[]): CategoryBudgetRow | null
{
  const withLimit = rows.filter((r) => r.limite > 0)
  if (withLimit.length === 0)
  {
    return null
  }
  return [...withLimit].sort((a, b) => b.pct - a.pct)[0]
}

export interface BudgetSpendCheck
{
  categoryId: number
  categoryName: string
  gastoApos: number
  limite: number
  pct: number
  alert: BudgetAlertLevel
}

/** Verifica orçamento após um novo lançamento */
export function checkBudgetAfterSpend(
  categories: Category[],
  budgetLimits: BudgetLimit[],
  monthTx: Transaction[],
  categoryId: number | undefined,
  valor: number,
): BudgetSpendCheck | null
{
  if (categoryId == null) return null

  const rollupId = resolveRollupCategoryId(categories, categoryId)
  if (rollupId == null) return null

  const limite = budgetLimits.find((b) => b.categoria_id === rollupId)?.limite ?? 0
  if (limite <= 0) return null

  const gastoAtual = sumCategorySpend(monthTx, rollupId, categories)
  const gastoApos = gastoAtual + valor
  const pct = (gastoApos / limite) * 100
  const cat = categories.find((c) => c.id === rollupId)

  return {
    categoryId: rollupId,
    categoryName: cat?.nome ?? 'Categoria',
    gastoApos,
    limite,
    pct,
    alert: budgetAlertLevel(pct),
  }
}
