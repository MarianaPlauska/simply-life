import { useMemo, useId, useState } from 'react'
import { isGarrafa } from '../../lib/waterHydration'
import { aguaRitualMetaCopos } from '../../lib/healthRitual'
import { WaterDefaultMlControls, WaterEntryMlEditor } from './WaterHydrationControls'

interface WaterCupGridProps
{
  entries: number[]
  goal: number
  baseGoal?: number
  defaultMl: number
  mlPresets: number[]
  onEntriesChange: (next: number[]) => void
  onDefaultMlChange?: (ml: number) => void
  onAddMlPreset?: (ml: number) => void
  onRemoveMlPreset?: (ml: number) => void
  disabled?: boolean
  compact?: boolean
}

function CupSvg({ filled, gradId }: { filled: boolean; gradId: string })
{
  return (
    <svg viewBox="0 0 40 52" className="w-full h-full drop-shadow-sm" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--sl-water-fill, var(--sl-accent))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--sl-water-fill-end, var(--sl-accent-hover))" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <path
        d="M10 6 h20 l-3 40 a4 4 0 0 1-4 3.5 H17 a4 4 0 0 1-4-3.5 Z"
        fill={filled ? `url(#${gradId})` : 'var(--sl-chrome)'}
        stroke="var(--sl-border)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        className="transition-colors duration-300"
      />
      {filled && (
        <ellipse cx="20" cy="14" rx="7" ry="2" fill="var(--sl-elevated)" opacity="0.45" />
      )}
    </svg>
  )
}

function BottleSvg({ filled, gradId }: { filled: boolean; gradId: string })
{
  return (
    <svg viewBox="0 0 40 52" className="w-full h-full drop-shadow-sm" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--sl-water-fill, var(--sl-accent))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--sl-water-fill-end, var(--sl-accent-hover))" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <rect x="14" y="4" width="12" height="6" rx="2" fill="var(--sl-border)" />
      <path
        d="M12 10 h16 l-2 38 a5 5 0 0 1-5 4 H19 a5 5 0 0 1-5-4 Z"
        fill={filled ? `url(#${gradId})` : 'var(--sl-chrome)'}
        stroke="var(--sl-border)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {filled && (
        <rect x="15" y="22" width="10" height="14" rx="2" fill="var(--sl-elevated)" opacity="0.35" />
      )}
    </svg>
  )
}

export function WaterCupGrid({
  entries,
  goal,
  baseGoal,
  defaultMl,
  mlPresets,
  onEntriesChange,
  onDefaultMlChange,
  onAddMlPreset,
  onRemoveMlPreset,
  disabled = false,
  compact = false,
}: WaterCupGridProps)
{
  const baseId = useId()
  const metaGoal = baseGoal ?? goal
  const ritualCups = useMemo(() => aguaRitualMetaCopos(metaGoal), [metaGoal])
  const current = entries.length
  const cupCount = Math.min(Math.max(goal, metaGoal, current + 1), 12)
  const cols = cupCount <= 6 ? cupCount : 4
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const handleSlot = (index: number) =>
  {
    if (disabled) return
    if (index < entries.length)
    {
      setEditingIndex(index === editingIndex ? null : index)
      return
    }
    onEntriesChange([...entries, defaultMl])
    setEditingIndex(null)
  }

  const removeEntry = (index: number) =>
  {
    onEntriesChange(entries.filter((_, i) => i !== index))
    setEditingIndex(null)
  }

  const setEntryMl = (index: number, ml: number) =>
  {
    const next = [...entries]
    next[index] = ml
    onEntriesChange(next)
    setEditingIndex(null)
  }

  return (
    <div className="space-y-2">
      {onDefaultMlChange && (
        <WaterDefaultMlControls
          defaultMl={defaultMl}
          presets={mlPresets}
          onDefaultChange={onDefaultMlChange}
          onAddPreset={onAddMlPreset}
          onRemovePreset={onRemoveMlPreset}
          disabled={disabled}
        />
      )}

      <div
        className={`grid gap-2 ${compact ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        role="group"
        aria-label={`${current} de ${metaGoal} — ${entries.reduce((a, b) => a + b, 0)} ml`}
      >
        {Array.from({ length: cupCount }, (_, i) =>
        {
          const filled = i < entries.length
          const ml = filled ? entries[i] : defaultMl
          const garrafa = isGarrafa(ml)
          const isExtraCup = i >= metaGoal

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handleSlot(i)}
              className={[
                'relative flex flex-col items-center justify-end rounded-sl transition-all',
                compact ? 'p-1 min-h-[52px]' : 'p-1.5 sm:p-2 min-h-[64px] sm:min-h-[72px]',
                'border border-transparent hover:border-accent/25 hover:bg-accent-muted/30',
                isExtraCup ? 'border-dashed border-accent/20' : '',
                editingIndex === i ? 'ring-1 ring-accent/40 bg-accent-muted/20' : '',
                'active:scale-95 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
                filled ? 'text-accent' : 'text-ink-muted',
              ].join(' ')}
              aria-label={
                filled
                  ? `${garrafa ? 'Garrafa' : 'Copo'} ${i + 1} — ${ml} ml — toque para editar`
                  : `Vazio — toque para adicionar ${defaultMl} ml`
              }
              aria-pressed={filled}
            >
              {garrafa ? (
                <BottleSvg filled={filled} gradId={`${baseId}-bottle-${i}`} />
              ) : (
                <CupSvg filled={filled} gradId={`${baseId}-cup-${i}`} />
              )}
              {filled && (
                <span className="font-mono text-[8px] tabular-nums mt-0.5 text-ink-muted">
                  {ml}ml
                </span>
              )}
            </button>
          )
        })}
      </div>

      {editingIndex !== null && entries[editingIndex] !== undefined && (
        <WaterEntryMlEditor
          index={editingIndex}
          currentMl={entries[editingIndex]}
          presets={mlPresets}
          onApply={(ml) => setEntryMl(editingIndex, ml)}
          onRemove={() => removeEntry(editingIndex)}
          disabled={disabled}
        />
      )}
    </div>
  )
}
