import { MOODS } from '../../lib/moodConstants'
import { AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

interface MoodQuickPickerProps
{
  disabled?: boolean
  selected?: number | null
  compact?: boolean
  onSelect: (value: number, label: string) => void
}

function moodIconClass(colorClass: string): string
{
  return colorClass.split(' ').find((c) => c.startsWith('text-')) ?? 'text-ink-muted'
}

export function MoodQuickPicker({ disabled, selected, compact, onSelect }: MoodQuickPickerProps)
{
  return (
    <div className={`grid grid-cols-5 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {MOODS.map((m) =>
      {
        const Icon = m.icon
        const active = selected === m.value
        const iconClass = moodIconClass(m.colorClass)
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(m.value, m.label)}
            className={`
              sl-touch flex flex-col items-center gap-1 rounded-sl border
              hover:scale-[1.02] disabled:opacity-50
              ${compact ? 'p-1.5' : 'p-2'}
              ${AXEL_TOUCH_PRESS}
              ${active
                ? `${m.colorClass} ring-1 ring-white/10`
                : `${m.colorClass} opacity-75 hover:opacity-100`}
            `}
            title={m.label}
          >
            <Icon
              size={compact ? 18 : 20}
              strokeWidth={1.75}
              className={iconClass}
            />
            <span className={`font-mono uppercase tracking-wide ${compact ? 'text-[9px]' : 'text-ui-caption'} ${iconClass}`}>
              {compact ? m.shortLabel.slice(0, 3) : m.shortLabel}
            </span>
          </button>
        )
      })}
    </div>
  )
}
