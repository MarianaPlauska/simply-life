import { useId, useState } from 'react'
import { isGarrafa } from '../../lib/waterHydration'
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

function CupSvg({ filled, fillRatio, gradId }: { filled: boolean; fillRatio: number; gradId: string })
{
  const waterTop = 46 - 32 * Math.min(1, Math.max(0.18, fillRatio))

  return (
    <svg viewBox="0 0 36 48" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--sl-health)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--sl-health)" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id={`${gradId}-clip`}>
          <path d="M9 8 h18 l-2.4 32 a5 5 0 0 1-5 4.2 H16.4 a5 5 0 0 1-5-4.2 Z" />
        </clipPath>
      </defs>
      <path
        d="M9 8 h18 l-2.4 32 a5 5 0 0 1-5 4.2 H16.4 a5 5 0 0 1-5-4.2 Z"
        fill="color-mix(in srgb, var(--sl-ink) 16%, var(--sl-canvas))"
        stroke="var(--sl-health)"
        strokeOpacity={filled ? 0.95 : 0.45}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {filled && (
        <g clipPath={`url(#${gradId}-clip)`}>
          <rect x="8" y={waterTop} width="20" height={48 - waterTop} fill={`url(#${gradId})`} />
          <ellipse cx="18" cy={waterTop + 1} rx="7.2" ry="1.6" fill="var(--sl-ink)" opacity="0.18" />
        </g>
      )}
      <path
        d="M11 8.2 h14"
        stroke="var(--sl-health)"
        strokeOpacity={filled ? 0.9 : 0.4}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BottleSvg({ filled, fillRatio, gradId }: { filled: boolean; fillRatio: number; gradId: string })
{
  const waterTop = 44 - 28 * Math.min(1, Math.max(0.2, fillRatio))

  return (
    <svg viewBox="0 0 36 48" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="var(--sl-health)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--sl-health)" stopOpacity="0.55" />
        </linearGradient>
        <clipPath id={`${gradId}-clip`}>
          <path d="M12 11 h12 l-1.6 29 a4.5 4.5 0 0 1-4.4 3.6 H18 a4.5 4.5 0 0 1-4.4-3.6 Z" />
        </clipPath>
      </defs>
      <rect x="14" y="3" width="8" height="5" rx="1.5" fill="var(--sl-health)" opacity={filled ? 0.9 : 0.4} />
      <path
        d="M12 11 h12 l-1.6 29 a4.5 4.5 0 0 1-4.4 3.6 H18 a4.5 4.5 0 0 1-4.4-3.6 Z"
        fill="color-mix(in srgb, var(--sl-ink) 16%, var(--sl-canvas))"
        stroke="var(--sl-health)"
        strokeOpacity={filled ? 0.95 : 0.45}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {filled && (
        <g clipPath={`url(#${gradId}-clip)`}>
          <rect x="11" y={waterTop} width="14" height={48 - waterTop} fill={`url(#${gradId})`} />
        </g>
      )}
    </svg>
  )
}

function columnCount(cupCount: number): number
{
  if (cupCount <= 5) return cupCount
  if (cupCount <= 10) return 5
  return 5
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
  const current = entries.length
  // Sempre mostra a grade da meta (2 L) — extra só quando a meta já foi batida
  const cupCount = Math.min(Math.max(metaGoal, current >= metaGoal ? current + 1 : metaGoal), 16)
  const cols = columnCount(cupCount)
  const colMin = compact ? '2.6rem' : '2.75rem'
  const colMax = compact ? '3.4rem' : '3.6rem'
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

  let defaultMlPanel = null
  if (onDefaultMlChange)
  {
    defaultMlPanel = (
      <WaterDefaultMlControls
        defaultMl={defaultMl}
        presets={mlPresets}
        onDefaultChange={onDefaultMlChange}
        onAddPreset={onAddMlPreset}
        onRemovePreset={onRemoveMlPreset}
        disabled={disabled}
      />
    )
  }

  let entryEditor = null
  if (editingIndex !== null && entries[editingIndex] !== undefined)
  {
    const idx = editingIndex
    const currentMl = entries[idx]
    entryEditor = (
      <WaterEntryMlEditor
        index={idx}
        currentMl={currentMl}
        presets={mlPresets}
        onApply={(ml) => setEntryMl(idx, ml)}
        onRemove={() => removeEntry(idx)}
        disabled={disabled}
      />
    )
  }

  const gridGap = compact ? 'gap-2.5 sm:gap-3' : 'gap-2 sm:gap-2.5'
  const totalMl = entries.reduce((a, b) => a + b, 0)
  const metaMl = metaGoal * defaultMl

  return (
    <div className="space-y-2">
      {defaultMlPanel}

      <div
        className={`grid w-full max-w-md justify-items-center ${gridGap}`}
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(${colMin}, ${colMax}))` }}
        role="group"
        aria-label={`${current} de ${metaGoal} copos — ${totalMl} de ${metaMl} ml`}
      >
        {Array.from({ length: cupCount }, (_, i) =>
        {
          const filled = i < entries.length
          const ml = filled ? entries[i] : defaultMl
          const garrafa = isGarrafa(ml)
          const isExtraCup = i >= metaGoal
          const fillRatio = filled ? Math.min(1, ml / Math.max(defaultMl, 1)) : 0

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => handleSlot(i)}
              className={[
                'sl-touch relative flex flex-col items-center justify-end rounded-sl w-full',
                compact ? 'p-1 min-h-[48px] sm:min-h-[52px]' : 'p-1 sm:p-1.5 min-h-[56px] sm:min-h-[64px]',
                'border border-transparent hover:bg-health-muted/50',
                'active:scale-95 transition-all duration-150 ease-out',
                isExtraCup ? 'border-dashed border-health/25' : '',
                editingIndex === i ? 'ring-1 ring-health/40 bg-health-muted/30' : '',
                'disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-health',
                filled ? 'text-health' : 'text-ink-muted',
              ].join(' ')}
              aria-label={
                filled
                  ? `${garrafa ? 'Garrafa' : 'Copo'} ${i + 1} — ${ml} ml — toque para editar`
                  : `Vazio — toque para adicionar ${defaultMl} ml`
              }
              aria-pressed={filled}
            >
              <span className={compact ? 'w-7 h-9 sm:w-8 sm:h-10' : 'w-8 h-11 sm:w-9 sm:h-12'}>
                {garrafa ? (
                  <BottleSvg filled={filled} fillRatio={fillRatio} gradId={`${baseId}-bottle-${i}`} />
                ) : (
                  <CupSvg filled={filled} fillRatio={fillRatio} gradId={`${baseId}-cup-${i}`} />
                )}
              </span>
            </button>
          )
        })}
      </div>

      {entryEditor}
    </div>
  )
}
