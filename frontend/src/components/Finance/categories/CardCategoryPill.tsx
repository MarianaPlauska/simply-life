import { X } from 'lucide-react'
import { FinanceCategoryIcon } from '../financeCategoryIcons'
import {
  AXEL_CHIP_SELECT_ACTIVE,
  AXEL_CHIP_SELECT_IDLE,
} from '../../../constants/axelSurfaces'
import type { CardCategory } from '../../../lib/financeCardCategories'

interface CardCategoryPillProps
{
  category: CardCategory
  active: boolean
  onSelect: () => void
  onRemove?: (id: string) => void
}

export function CardCategoryPill({
  category,
  active,
  onSelect,
  onRemove,
}: CardCategoryPillProps)
{
  return (
    <span className="inline-flex items-center max-w-full">
      <button
        type="button"
        onClick={onSelect}
        className={`max-w-full inline-flex items-center gap-1 ${active ? AXEL_CHIP_SELECT_ACTIVE : AXEL_CHIP_SELECT_IDLE}`}
      >
        <FinanceCategoryIcon name={category.icone} className="w-3 h-3 shrink-0" />
        <span className="truncate max-w-[88px] sm:max-w-[120px]">{category.nome}</span>
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remover ${category.nome} do atalho`}
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
