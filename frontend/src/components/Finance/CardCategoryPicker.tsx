import { useEffect, useMemo, useState } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import {
  loadCardCategories,
  type CardCategory,
} from '../../lib/financeCardCategories'
import {
  getPinnedCardCategoryIds,
  seedDefaultCardCategoryPins,
  unpinCardCategory,
} from '../../lib/financeCardCategoryPins'
import { CardCategoryPill } from './categories/CardCategoryPill'
import {
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface CardCategoryPickerProps
{
  cardId: string
  value: string
  onChange: (id: string) => void
  onAddCategory?: () => void
  onManageCategories?: () => void
  /** Incrementar ao fechar o modal de categorias para recarregar atalhos */
  pinVersion?: number
}

export function CardCategoryPicker({
  cardId,
  value,
  onChange,
  onAddCategory,
  onManageCategories,
  pinVersion = 0,
}: CardCategoryPickerProps)
{
  const [categorias, setCategorias] = useState<CardCategory[]>(() => loadCardCategories(cardId))
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => getPinnedCardCategoryIds(cardId))

  useEffect(() =>
  {
    const lista = loadCardCategories(cardId)
    setCategorias(lista)
    seedDefaultCardCategoryPins(cardId, lista.map((c) => c.id))
    const ids = new Set(lista.map((c) => c.id))
    const valid = getPinnedCardCategoryIds(cardId).filter((id) => ids.has(id))
    setPinnedIds(valid)
  }, [cardId, pinVersion])

  const pinnedCategories = useMemo(
    () => pinnedIds
      .map((id) => categorias.find((c) => c.id === id))
      .filter((c): c is CardCategory => c != null),
    [pinnedIds, categorias],
  )

  const handleUnpin = (id: string) =>
  {
    setPinnedIds(unpinCardCategory(cardId, id))
    if (value === id)
    {
      onChange('')
    }
  }

  const pickCategory = (cat: CardCategory) =>
  {
    onChange(value === cat.id ? '' : cat.id)
  }

  return (
    <div className="space-y-2.5 rounded-sl bg-chrome/30 p-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Atalhos · × remove do atalho
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
            <CardCategoryPill
              key={c.id}
              category={c}
              active={value === c.id}
              onSelect={() => pickCategory(c)}
              onRemove={handleUnpin}
            />
          ))}
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
