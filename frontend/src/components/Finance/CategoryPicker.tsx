import { useEffect, useMemo, useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import type { Category } from '../../store/storeTypes'
import { dedupeCategories } from '../../lib/financeCategoryDedupe'
import {
  getPinnedCategoryIds,
  seedDefaultCategoryPins,
  unpinCategory,
} from '../../lib/financeCategoryPins'
import {
  getSubcategories,
} from '../../lib/financeCategoryTree'
import { CategoryPill } from './categories/CategoryPill'
import {
  AXEL_CHIP_SELECT_ACTIVE,
  AXEL_CHIP_SELECT_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface CategoryPickerProps
{
  categories: Category[]
  tipo?: 'receita' | 'despesa'
  value: number | ''
  onChange: (id: number | '') => void
  compact?: boolean
  onAddCategory?: () => void
  onAddSubcategory?: (parentId: number) => void
  onManageCategories?: () => void
  /** Incrementar ao fechar o modal de categorias para recarregar atalhos */
  pinVersion?: number
}

export function CategoryPicker({
  categories,
  tipo = 'despesa',
  value,
  onChange,
  compact: _compact = false,
  onAddCategory,
  onAddSubcategory,
  onManageCategories,
  pinVersion = 0,
}: CategoryPickerProps)
{
  const isReceita = tipo === 'receita'
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => getPinnedCategoryIds(tipo))

  const uniqueCategories = useMemo(
    () => dedupeCategories(categories),
    [categories],
  )

  useEffect(() =>
  {
    seedDefaultCategoryPins(uniqueCategories)
    const ids = new Set(uniqueCategories.map((c) => c.id))
    const valid = getPinnedCategoryIds(tipo).filter((id) => ids.has(id))
    setPinnedIds(valid)
  }, [uniqueCategories, tipo, pinVersion])

  const pinnedCategories = useMemo(
    () => pinnedIds
      .map((id) => uniqueCategories.find((c) => c.id === id))
      .filter((c): c is Category => c != null && c.tipo === tipo),
    [pinnedIds, uniqueCategories, tipo],
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

  const pickCategory = (cat: Category) =>
  {
    const children = getSubcategories(uniqueCategories, cat.id)
    if (children.length === 0)
    {
      onChange(value === cat.id ? '' : cat.id)
      return
    }
    onChange(cat.id)
  }

  const handleUnpin = (id: number) =>
  {
    setPinnedIds(unpinCategory(id, tipo))
    if (value === id)
    {
      onChange('')
    }
  }

  return (
    <div className="space-y-2.5 rounded-sl bg-chrome/30 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          {isReceita
            ? 'Atalhos de categoria · × remove do atalho'
            : 'Atalhos · × remove do atalho'}
        </p>
        {onManageCategories && (
          <button
            type="button"
            onClick={onManageCategories}
            className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline shrink-0 min-h-[36px] px-1"
          >
            <Settings2 size={11} />
            Gerenciar
          </button>
        )}
      </div>

      {pinnedCategories.length === 0 ? (
        <p className={`text-[11px] leading-relaxed px-1 ${AXEL_TEXT_SECONDARY}`}>
          Nenhum atalho ainda. Abra <strong className="text-ink">Gerenciar</strong> ou{' '}
          <strong className="text-ink">Nova categoria</strong> e toque na categoria para fixar aqui.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {pinnedCategories.map((c) => (
            <CategoryPill
              key={c.id}
              category={c}
              active={value === c.id || selectedParentId === c.id}
              onSelect={() => pickCategory(c)}
              onRemove={handleUnpin}
            />
          ))}
        </div>
      )}

      {selectedParentId != null && subs.length > 0 && (
        <div className="pt-1 border-t border-line/60">
          <p className={`font-mono text-[9px] uppercase tracking-wide mb-1 ${AXEL_TEXT_SECONDARY}`}>
            Detalhe
          </p>
          <div className="flex flex-wrap gap-1">
            {subs.map((sub) =>
            {
              const active = value === sub.id
              return (
                <span key={sub.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => onChange(active ? selectedParentId : sub.id)}
                    className={active ? AXEL_CHIP_SELECT_ACTIVE : AXEL_CHIP_SELECT_IDLE}
                  >
                    {sub.nome}
                  </button>
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

      {onAddCategory && (
        <div className="pt-1 border-t border-line/60">
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl border border-dashed border-line font-mono text-[9px] uppercase text-ink-muted hover:text-accent min-h-[36px]"
          >
            <Plus size={12} />
            Nova categoria
          </button>
        </div>
      )}
    </div>
  )
}
