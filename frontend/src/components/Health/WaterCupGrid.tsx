import { useMemo, useId } from 'react'
import { isAguaRitualComplete } from '../../lib/healthRitual'

// Grade de copos — interação principal de hidratação (toque no copo)

interface WaterCupGridProps
{
  current: number
  goal: number
  /** Meta real (ritual 80%); se omitida, usa `goal` */
  baseGoal?: number
  onSet: (next: number) => void
  disabled?: boolean
  compact?: boolean
}

function CupSvg({ filled, ritualLine, gradId }: { filled: boolean; ritualLine: boolean; gradId: string })
{
  return (
    <svg
      viewBox="0 0 40 52"
      className="w-full h-full drop-shadow-sm"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgb(14 165 233 / 0.95)" />
          <stop offset="100%" stopColor="rgb(56 189 248 / 0.75)" />
        </linearGradient>
      </defs>
      <path
        d="M10 6 h20 l-3 40 a4 4 0 0 1-4 3.5 H17 a4 4 0 0 1-4-3.5 Z"
        className={`transition-colors duration-300 ${
          filled ? '' : 'fill-chrome/40'
        }`}
        fill={filled ? `url(#${gradId})` : undefined}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {filled && (
        <ellipse cx="20" cy="14" rx="7" ry="2" fill="rgb(186 230 253 / 0.45)" />
      )}
      {ritualLine && !filled && (
        <line x1="8" y1="42" x2="32" y2="42" stroke="rgb(56 189 248 / 0.35)" strokeWidth="1" strokeDasharray="3 2" />
      )}
    </svg>
  )
}

export function WaterCupGrid({ current, goal, baseGoal, onSet, disabled = false, compact = false }: WaterCupGridProps)
{
  const baseId = useId()
  const metaGoal = baseGoal ?? goal
  const ritualThreshold = useMemo(
    () => Math.ceil(metaGoal * 0.8),
    [metaGoal],
  )

  const cupCount = Math.min(Math.max(goal, metaGoal), 12)
  const cols = cupCount <= 6 ? cupCount : cupCount <= 8 ? 4 : 4

  const handleCup = (index: number) =>
  {
    if (disabled) return
    const target = index + 1
    if (current === target)
    {
      onSet(index)
      return
    }
    onSet(target)
  }

  return (
    <div
      className={`grid gap-2 ${compact ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      role="group"
      aria-label={`${current} de ${metaGoal} copos`}
    >
      {Array.from({ length: cupCount }, (_, i) =>
      {
        const filled = i < current
        const isRitualCup = i + 1 === ritualThreshold
        const ritualOk = isAguaRitualComplete(current, metaGoal)
        const isExtraCup = i >= metaGoal

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => handleCup(i)}
            className={[
              'relative flex flex-col items-center justify-end rounded-sl transition-all',
              compact ? 'p-1 min-h-[52px]' : 'p-1.5 sm:p-2 min-h-[64px] sm:min-h-[72px]',
              'border border-transparent hover:border-sky-500/30 hover:bg-sky-500/5',
              isExtraCup ? 'border-dashed border-sky-500/20' : '',
              'active:scale-95 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-400',
              filled ? 'text-sky-300' : 'text-ink-muted',
            ].join(' ')}
            aria-label={
              filled
                ? `Copo ${i + 1} bebido — toque para desfazer`
                : `Copo ${i + 1} vazio — toque para marcar`
            }
            aria-pressed={filled}
          >
            <CupSvg filled={filled} ritualLine={isRitualCup && !ritualOk} gradId={`${baseId}-cup-${i}`} />
            {!compact && (
              <span className="font-mono text-[9px] tabular-nums mt-0.5 text-ink-muted">
                {i + 1}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
