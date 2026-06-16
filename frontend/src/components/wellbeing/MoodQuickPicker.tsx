import { MOODS } from '../../lib/moodConstants'

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
        const Icon = m.icon
        const active = selected === m.value
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(m.value, m.label)}
            className={`
              flex flex-col items-center gap-1 rounded-sl border transition-all
              hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50
              ${compact ? 'p-1.5' : 'p-2'}
              ${active ? `${m.colorClass} ring-1 ring-accent/30` : `${m.colorClass} opacity-80 hover:opacity-100`}
            `}
            title={m.label}
          >
            <Icon size={compact ? 18 : 20} strokeWidth={1.75} />
            <span className={`font-mono uppercase tracking-wide ${compact ? 'text-[7px]' : 'text-[8px]'}`}>
              {compact ? m.shortLabel.slice(0, 3) : m.shortLabel}
            </span>
          </button>
        )
      })}
    </div>
  )
}
