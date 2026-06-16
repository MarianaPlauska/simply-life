import type { ReactNode, SVGProps } from 'react'
import type { AvatarStyleId } from '../../lib/axelAvatarPresets'

type AvatarSize = number | 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-9 h-9 md:w-10 md:h-10',
  md: 'w-10 h-10 md:w-12 md:h-12',
  lg: 'w-11 h-11 md:w-14 md:h-14',
}

const INITIALS_TEXT: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'text-xs md:text-sm',
  md: 'text-sm md:text-base',
  lg: 'text-base md:text-lg',
}

interface AxelCompanionAvatarProps
{
  style: AvatarStyleId
  initials?: string
  size?: AvatarSize
  className?: string
}

function resolveBox(size: AvatarSize): { className?: string; px?: number }
{
  if (typeof size === 'number')
  {
    return { px: size }
  }
  return { className: SIZE_CLASS[size] }
}

function AvatarFrame({
  box,
  className,
  children,
}: {
  box: ReturnType<typeof resolveBox>
  className?: string
  children: ReactNode
})
{
  if (box.px)
  {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center ${className ?? ''}`}
        style={{ width: box.px, height: box.px }}
        aria-hidden
      >
        {children}
      </span>
    )
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box.className ?? ''} ${className ?? ''}`} aria-hidden>
      {children}
    </span>
  )
}

/** Olhos no mesmo estilo da coruja — círculos com pupilas */
function OwlEyes({ leftX, rightX, y, r = 4 }: { leftX: number; rightX: number; y: number; r?: number })
{
  const pupil = r * 0.45
  return (
    <>
      <circle cx={leftX} cy={y} r={r + 2} fill="#F5E6D3" />
      <circle cx={rightX} cy={y} r={r + 2} fill="#F5E6D3" />
      <circle cx={leftX} cy={y} r={pupil} fill="#2A2520" />
      <circle cx={rightX} cy={y} r={pupil} fill="#2A2520" />
      <circle cx={leftX - 1} cy={y - 1} r={pupil * 0.35} fill="#F5E6D3" opacity="0.9" />
      <circle cx={rightX - 1} cy={y - 1} r={pupil * 0.35} fill="#F5E6D3" opacity="0.9" />
    </>
  )
}

/** Companheiros SVG — mesmo vocabulário visual (fundo arredondado, rosto legível) */
export function AxelCompanionAvatar({
  style,
  initials = '',
  size = 'md',
  className = '',
}: AxelCompanionAvatarProps)
{
  const box = resolveBox(size)

  if (style === 'initials')
  {
    const text = initials || '?'
    const textClass = typeof size === 'number' ? '' : INITIALS_TEXT[size]
    return (
      <AvatarFrame box={box} className={className}>
        <div
          className={`w-full h-full rounded-sl bg-accent/15 border border-accent/30 flex items-center justify-center font-display text-accent ${textClass}`}
        >
          {text}
        </div>
      </AvatarFrame>
    )
  }

  return (
    <AvatarFrame box={box} className={className}>
      {renderCompanionSvg(style, {
        viewBox: '0 0 64 64',
        className: 'w-full h-full',
        'aria-hidden': true as const,
      })}
    </AvatarFrame>
  )
}

function renderCompanionSvg(style: AvatarStyleId, svgProps: SVGProps<SVGSVGElement>)
{
  if (style === 'companion_owl')
  {
    return (
      <svg {...svgProps}>
        <rect width="64" height="64" rx="14" fill="var(--sl-accent-muted, rgba(193,127,58,0.15))" />
        <ellipse cx="32" cy="38" rx="21" ry="18" fill="#C17F3A" />
        <ellipse cx="32" cy="40" rx="14" ry="11" fill="#D4924A" opacity="0.55" />
        <OwlEyes leftX={24} rightX={40} y={30} r={3.5} />
        <path d="M32 37 L28 43 L36 43 Z" fill="#E8A84A" />
        <path d="M22 22 Q24 18 27 21" stroke="#A66B2A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M42 22 Q40 18 37 21" stroke="#A66B2A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    )
  }

  if (style === 'companion_fox')
  {
    return (
      <svg {...svgProps}>
        <rect width="64" height="64" rx="14" fill="var(--sl-accent-muted, rgba(193,127,58,0.14))" />
        {/* orelhas */}
        <path d="M17 30 L22 14 L28 28 Z" fill="#C17F3A" />
        <path d="M47 30 L42 14 L36 28 Z" fill="#C17F3A" />
        <path d="M19 28 L23 17 L27 27 Z" fill="#F5E6D3" opacity="0.85" />
        <path d="M45 28 L41 17 L37 27 Z" fill="#F5E6D3" opacity="0.85" />
        {/* cabeça */}
        <ellipse cx="32" cy="36" rx="20" ry="17" fill="#E8A84A" />
        {/* máscara clara */}
        <ellipse cx="32" cy="39" rx="13" ry="11" fill="#F5E6D3" />
        <ellipse cx="32" cy="41" rx="8" ry="6" fill="#FFF8F0" opacity="0.7" />
        <OwlEyes leftX={25} rightX={39} y={32} r={3} />
        <ellipse cx="32" cy="40" rx="3.2" ry="2.4" fill="#2A2520" />
        <path d="M32 42 Q28 44 26 42" stroke="#2A2520" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        <path d="M32 42 Q36 44 38 42" stroke="#2A2520" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.5" />
        {/* peito */}
        <ellipse cx="32" cy="50" rx="10" ry="5" fill="#D4924A" opacity="0.65" />
      </svg>
    )
  }

  // companion_bloom — flor com rostinho (mesmo vocabulário dos olhos)
  return (
    <svg {...svgProps}>
      <rect width="64" height="64" rx="14" fill="var(--sl-accent-muted, rgba(74,124,89,0.14))" />
      {/* pétalas */}
      <ellipse cx="32" cy="18" rx="7" ry="10" fill="#6B9E78" opacity="0.9" />
      <ellipse cx="32" cy="46" rx="7" ry="10" fill="#6B9E78" opacity="0.9" />
      <ellipse cx="16" cy="32" rx="10" ry="7" fill="#5C9468" opacity="0.9" />
      <ellipse cx="48" cy="32" rx="10" ry="7" fill="#5C9468" opacity="0.9" />
      <ellipse cx="20" cy="20" rx="8" ry="8" fill="#7CB088" opacity="0.75" transform="rotate(-35 20 20)" />
      <ellipse cx="44" cy="20" rx="8" ry="8" fill="#7CB088" opacity="0.75" transform="rotate(35 44 20)" />
      {/* centro */}
      <circle cx="32" cy="32" r="13" fill="#F5E6D3" />
      <circle cx="32" cy="32" r="11" fill="#FFF3E4" opacity="0.6" />
      <OwlEyes leftX={27} rightX={37} y={30} r={2.5} />
      <path d="M28 36 Q32 39 36 36" stroke="#2A2520" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="24" cy="35" r="1.8" fill="#E8A0A0" opacity="0.45" />
      <circle cx="40" cy="35" r="1.8" fill="#E8A0A0" opacity="0.45" />
      {/* caule */}
      <path d="M32 45 Q30 52 32 56" stroke="#4A7C59" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="28" cy="52" rx="5" ry="3" fill="#5C9468" opacity="0.8" transform="rotate(-25 28 52)" />
    </svg>
  )
}
