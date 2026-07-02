import { AVATAR_PRESETS, iniciaisDe, type AvatarStyleId } from '../../lib/axelAvatarPresets'
import { AxelCompanionAvatar } from './AxelCompanionAvatar'

interface AxelAvatarPickerProps
{
  value: AvatarStyleId
  displayName: string
  onChange: (id: AvatarStyleId) => void
  /** Se omitido, mostra todos os presets */
  allowedStyles?: AvatarStyleId[]
}

export function AxelAvatarPicker({ value, displayName, onChange, allowedStyles }: AxelAvatarPickerProps)
{
  const initials = iniciaisDe(displayName)
  const presets = allowedStyles
    ? AVATAR_PRESETS.filter((preset) => allowedStyles.includes(preset.id))
    : AVATAR_PRESETS

  return (
    <div className="space-y-2 md:space-y-2.5">
      <p className="font-mono text-[10px] md:text-xs uppercase tracking-wide text-ink-muted">
        Seu rosto no Círculo
      </p>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-3">
        {presets.map((preset) =>
        {
          const selected = value === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.id)}
              className={`flex flex-col items-center justify-center gap-1 sm:gap-1.5 md:gap-2 p-1.5 sm:p-2 md:p-3 min-h-[4.5rem] sm:min-h-[5rem] md:min-h-[5.5rem] rounded-sl border transition-colors ${
                selected ? 'border-accent bg-accent/10 ring-1 ring-accent/30' : 'border-line hover:border-accent/40'
              }`}
              aria-pressed={selected}
              title={preset.hint}
            >
              <AxelCompanionAvatar
                style={preset.id}
                initials={initials || '?'}
                size="md"
              />
              <span className="text-[9px] md:text-[10px] font-mono text-ink-muted leading-tight text-center">
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
