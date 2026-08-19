import { AXEL_MOOD } from '../../design/identityTokens'
import { MOODS } from '../../lib/moodConstants'
import { AxelMoodFace } from '../axel/AxelMoodFace'
import { AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

interface MoodQuickPickerProps
{
  disabled?: boolean
  selected?: number | null
  compact?: boolean
  onSelect: (value: number, label: string) => void
}

export function MoodQuickPicker({ disabled, selected, compact, onSelect }: MoodQuickPickerProps)
{
  return (
    <div className={`grid grid-cols-5 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {MOODS.map((m) =>
      {
        const active = selected === m.value
        const stateLabel = Object.values(AXEL_MOOD.states).find((s) => s.value === m.value)?.label ?? m.shortLabel
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(m.value, m.label)}
            className={`
              sl-touch flex flex-col items-center justify-center gap-1 rounded-sl min-h-[52px]
              disabled:opacity-50
              ${compact ? 'p-1.5' : 'p-2'}
              ${AXEL_TOUCH_PRESS}
              ${active
                ? 'bg-axel-muted text-ink'
                : 'text-ink-muted hover:text-ink'}
            `}
            title={m.label}
          >
            <AxelMoodFace
              level={m.value}
              size={compact ? 22 : 26}
              title={stateLabel}
            />
            <span className={`font-sans leading-tight text-center w-full px-0.5 ${compact ? 'text-[11px]' : 'text-[12px]'} ${active ? 'text-ink' : 'text-ink-muted'}`}>
              {m.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
