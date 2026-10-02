// Marca SunFy: o símbolo "tudo se volta pra você" sobre petróleo e o nome com o "u" em coral
// O Axel é o personagem do app, não a marca
import { SunFyMarkShapes } from './SunFyMark'

type MarkVariant = 'icon' | 'lockup'

interface SimplyLifeMarkProps
{
  variant?: MarkVariant
  className?: string
}

/** SUNflower + FY (for you): o "u" em coral é o sorriso da marca */
export function SunFyWordmark({ className = '' }: { className?: string })
{
  return (
    <span className={className} aria-label="SunFy">
      S<span className="text-axel">u</span>nFy
    </span>
  )
}

export function SimplyLifeMark({ variant = 'icon', className = '' }: SimplyLifeMarkProps)
{
  if (variant === 'lockup')
  {
    return (
      <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
        <SimplyLifeMark variant="icon" className="w-9 h-9 shrink-0" />
        <span className="flex flex-col leading-tight min-w-0">
          <SunFyWordmark className="font-display text-[17px] font-semibold tracking-tight text-ink" />
          <span className="font-sans text-[11px] text-ink-muted">Um girassol pra você</span>
        </span>
      </span>
    )
  }

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden
      focusable="false"
    >
      <rect width="32" height="32" rx="7.2" fill="#1F3A3D" />
      <g transform="translate(2.88 2.88) scale(0.41)">
        <SunFyMarkShapes />
      </g>
    </svg>
  )
}
