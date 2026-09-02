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
  const btnMinH = compact ? 'min-h-[44px] md:min-h-[40px]' : 'min-h-[52px]'
  const iconSize = compact ? 22 : 26
  const labelSize = compact ? 'text-[11px] md:text-[10px]' : 'text-[12px]'

  return (
    <div className={`grid grid-cols-5 ${compact ? 'gap-1.5 max-w-md' : 'gap-2'}`}>
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
              sl-touch flex flex-col items-center justify-center gap-1 rounded-sl ${btnMinH}
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
              size={iconSize}
              title={stateLabel}
              quiet={!active}
            />
            <span className={`font-sans leading-tight text-center w-full px-0.5 ${labelSize} ${active ? 'text-ink' : 'text-ink-muted'}`}>
              {m.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
