// Marca SL + sorriso AXEL — ícone e assinatura

type MarkVariant = 'icon' | 'lockup'

interface SimplyLifeMarkProps
{
  variant?: MarkVariant
  className?: string
}

export function SimplyLifeMark({ variant = 'icon', className = '' }: SimplyLifeMarkProps)
{
  if (variant === 'lockup')
  {
    return (
      <span className={`inline-flex items-center gap-2.5 min-w-0 ${className}`}>
        <SimplyLifeMark variant="icon" className="w-9 h-9 shrink-0" />
        <span className="flex flex-col leading-tight min-w-0">
          <span className="font-sans text-[15px] font-semibold tracking-tight text-ink">
            Simply-Life
          </span>
          <span className="font-sans text-[11px] text-ink-muted">OS pessoal</span>
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
      <rect width="32" height="32" rx="7.2" fill="#1E1E1E" />
      <text
        x="16"
        y="20.5"
        textAnchor="middle"
        fontFamily="Manrope, Segoe UI, system-ui, sans-serif"
        fontSize="13"
        fontWeight="700"
        fill="#D4D4D4"
      >
        SL
      </text>
      <path
        d="M10.5 23.6c2.1 2.1 8.9 2.1 11 0"
        fill="none"
        stroke="#E8734A"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  )
}
