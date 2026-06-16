import {
  CARD_QUICK_SUBTYPES,
  type CardQuickSubtype,
} from '../../lib/financeCardQuickSubtypes'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface CardQuickSpendSubtypesProps
{
  selectedId: string | null
  onSelect: (subtype: CardQuickSubtype) => void
  /** scroll = uma linha horizontal (compacto); grid = grade maior */
  layout?: 'scroll' | 'grid'
  showLabel?: boolean
}

export function CardQuickSpendSubtypes({
  selectedId,
  onSelect,
  layout = 'scroll',
  showLabel = false,
}: CardQuickSpendSubtypesProps)
{
  if (layout === 'grid')
  {
    return (
      <div className="space-y-1.5">
        {showLabel && (
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            O que foi?
          </p>
        )}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {CARD_QUICK_SUBTYPES.map((st) => renderSubtypeButton(st, selectedId, onSelect, 'grid'))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-1 overflow-x-auto scrollbar-none -mx-0.5 px-0.5 pb-0.5">
      {CARD_QUICK_SUBTYPES.map((st) => renderSubtypeButton(st, selectedId, onSelect, 'scroll'))}
    </div>
  )
}

function renderSubtypeButton(
  st: CardQuickSubtype,
  selectedId: string | null,
  onSelect: (subtype: CardQuickSubtype) => void,
  layout: 'scroll' | 'grid',
)
{
  const active = selectedId === st.id
  const tone = active
    ? `${AXEL_FILTER_PILL_ACTIVE} border-accent/40`
    : `${AXEL_FILTER_PILL_IDLE} border-line hover:bg-chrome`

  if (layout === 'scroll')
  {
    return (
      <button
        key={st.id}
        type="button"
        onClick={() => onSelect(st)}
        className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-sl border min-h-[34px] transition-colors ${tone}`}
      >
        <span className="text-sm leading-none" aria-hidden>{st.emoji}</span>
        <span className="font-mono text-[9px] uppercase whitespace-nowrap">{st.label}</span>
      </button>
    )
  }

  return (
    <button
      key={st.id}
      type="button"
      onClick={() => onSelect(st)}
      className={`flex flex-col items-center justify-center gap-0.5 min-h-[48px] rounded-sl border px-1 py-1.5 transition-colors ${tone}`}
    >
      <span className="text-base leading-none" aria-hidden>{st.emoji}</span>
      <span className="font-mono text-[8px] uppercase leading-tight text-center">
        {st.label}
      </span>
    </button>
  )
}
