import { X } from 'lucide-react'
import { FinanceCategoryIcon } from '../financeCategoryIcons'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
} from '../../../constants/axelSurfaces'
import type { Category } from '../../../store/storeTypes'

interface CategoryPillProps
{
  category: Category
  active: boolean
  onSelect: () => void
  onRemove?: (id: number) => void
  showIcon?: boolean
}

export function CategoryPill({
  category,
  active,
  onSelect,
  onRemove,
  showIcon = true,
}: CategoryPillProps)
{
  return (
    <span className="inline-flex items-center max-w-full">
      <button
        type="button"
        onClick={onSelect}
        className={`inline-flex items-center gap-1.5 max-w-full ${
          active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
        }`}
      >
        {showIcon && (
          <FinanceCategoryIcon
            name={category.icone}
            className="w-3 h-3 shrink-0"
            style={{ color: category.cor }}
          />
        )}
        <span className="truncate max-w-[100px] sm:max-w-[140px]">{category.nome}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remover ${category.nome}`}
          onClick={(e) =>
          {
            e.stopPropagation()
            onRemove(category.id)
          }}
          className="ml-0.5 p-0.5 rounded-sl text-ink-muted/60 hover:text-urgente hover:bg-chrome transition-colors"
        >
          <X size={10} strokeWidth={2.5} />
        </button>
      )}
    </span>
  )
}
