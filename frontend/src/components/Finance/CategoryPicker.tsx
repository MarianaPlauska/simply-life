import { useMemo } from 'react'
import { Plus } from 'lucide-react'
import type { Category, CategoryGrupo } from '../../store/storeTypes'
import { CATEGORY_GRUPO_LABELS } from '../../lib/financeDefaultCategories'
import {
  getSubcategories,
  getTopLevelCategories,
} from '../../lib/financeCategoryTree'
import { dedupeCategories } from '../../lib/financeCategoryDedupe'
import { CategoryPill } from './categories/CategoryPill'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const GRUPO_ORDER: CategoryGrupo[] = ['casa', 'contas', 'futuro', 'geral']

interface CategoryPickerProps
{
  categories: Category[]
  tipo?: 'receita' | 'despesa'
  value: number | ''
  onChange: (id: number | '') => void
  compact?: boolean
  onAddCategory?: () => void
  onAddSubcategory?: (parentId: number) => void
  onRemoveCategory?: (id: number) => void
}

export function CategoryPicker({
  categories,
  tipo = 'despesa',
  value,
  onChange,
  compact = false,
  onAddCategory,
  onAddSubcategory,
  onRemoveCategory,
}: CategoryPickerProps)
{
  const uniqueCategories = useMemo(
    () => dedupeCategories(categories),
    [categories],
  )

  const parents = useMemo(
    () => getTopLevelCategories(uniqueCategories, tipo),
    [uniqueCategories, tipo],
  )

  const selectedParentId = useMemo(() =>
  {
    if (value === '') return null
    const cat = uniqueCategories.find((c) => c.id === value)
    if (!cat) return null
    return cat.parent_id ?? cat.id
  }, [uniqueCategories, value])

  const subs = useMemo(() =>
  {
    if (selectedParentId == null) return []
    return getSubcategories(uniqueCategories, selectedParentId)
  }, [uniqueCategories, selectedParentId])

  const grouped = useMemo(() =>
  {
    const map = new Map<CategoryGrupo, Category[]>()
    for (const g of GRUPO_ORDER) map.set(g, [])
    for (const c of parents)
    {
      const g = c.grupo ?? 'geral'
      map.get(g)?.push(c)
    }
    return GRUPO_ORDER
      .map((g) => ({ grupo: g, items: map.get(g) ?? [] }))
      .filter((block) => block.items.length > 0)
  }, [parents])

  const pickParent = (parent: Category) =>
  {
    const children = getSubcategories(uniqueCategories, parent.id)
    if (children.length === 0)
    {
      onChange(value === parent.id ? '' : parent.id)
      return
    }
    onChange(parent.id)
  }

  if (parents.length === 0)
  {
    return (
      <div className="space-y-2">
        <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
          Nenhuma categoria — crie uma abaixo
        </p>
        {onAddCategory && (
          <button
            type="button"
            onClick={onAddCategory}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-dashed border-line font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY} hover:border-accent/40 hover:text-accent`}
          >
            <Plus size={12} />
            Nova categoria
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {grouped.map(({ grupo, items }) => (
        <div key={grupo}>
          {!compact && (
            <p className={`font-mono text-[9px] uppercase tracking-wide mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
              {CATEGORY_GRUPO_LABELS[grupo]}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {items.map((c) => (
              <CategoryPill
                key={c.id}
                category={c}
                active={selectedParentId === c.id}
                onSelect={() => pickParent(c)}
                onRemove={onRemoveCategory}
              />
            ))}
          </div>
        </div>
      ))}

      {selectedParentId != null && subs.length > 0 && (
        <div>
          <p className={`font-mono text-[9px] uppercase tracking-wide mb-1.5 ${AXEL_TEXT_SECONDARY}`}>
            Detalhe do gasto
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subs.map((sub) =>
            {
              const active = value === sub.id
              return (
                <span key={sub.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onChange(active ? selectedParentId : sub.id)}
                    className={active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
                  >
                    {sub.nome}
                  </button>
                  {onRemoveCategory && (
                    <button
                      type="button"
                      onClick={() => onRemoveCategory(sub.id)}
                      className="ml-0.5 p-0.5 text-ink-muted/60 hover:text-urgente"
                      aria-label={`Remover ${sub.nome}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              )
            })}
            {onAddSubcategory && (
              <button
                type="button"
                onClick={() => onAddSubcategory(selectedParentId)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent"
              >
                <Plus size={10} />
                Sub
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onAddCategory && (
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent"
          >
            <Plus size={12} />
            Nova categoria
          </button>
        )}
        {onAddSubcategory && selectedParentId != null && subs.length === 0 && (
          <button
            type="button"
            onClick={() => onAddSubcategory(selectedParentId)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent"
          >
            <Plus size={12} />
            Subcategoria em {uniqueCategories.find((c) => c.id === selectedParentId)?.nome}
          </button>
        )}
      </div>
    </div>
  )
}
