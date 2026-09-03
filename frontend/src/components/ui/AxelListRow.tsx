import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ICON } from '../../design/identityTokens'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface AxelListRowProps
{
  title: string
  subtitle?: string
  trailing?: ReactNode
  icon?: LucideIcon
  iconNode?: ReactNode
  onClick?: () => void
  disabled?: boolean
  titleClassName?: string
}

/** Linha densa 56-64px - ícone 20px, título + data, valor à direita, sem card */
export function AxelListRow({
  title,
  subtitle,
  trailing,
  icon: Icon,
  iconNode,
  onClick,
  disabled = false,
  titleClassName,
}: AxelListRowProps)
{
  const inner = (
    <>
      {iconNode ?? (Icon && (
        <Icon
          className="w-5 h-5 shrink-0 text-ink-muted"
          strokeWidth={ICON.stroke}
          aria-hidden
        />
      ))}
      <span className="min-w-0 flex-1">
        <span className={`block text-[14px] leading-snug truncate ${titleClassName ?? AXEL_TEXT_PRIMARY}`}>
          {title}
        </span>
        {subtitle && (
          <span className={`block text-[12px] leading-snug truncate ${AXEL_TEXT_SECONDARY}`}>
            {subtitle}
          </span>
        )}
      </span>
      {trailing != null && (
        <span className={`shrink-0 font-mono text-[13px] tabular-nums ${AXEL_TEXT_PRIMARY}`}>
          {trailing}
        </span>
      )}
    </>
  )

  const rowClass = [
    'flex items-center gap-3 w-full min-h-[56px] px-1 py-2 text-left',
    onClick && !disabled ? 'hover:bg-chrome/40 transition-colors' : '',
    disabled ? 'opacity-70' : '',
  ].join(' ')

  return (
    <li className="border-t-[0.5px] border-line first:border-t-0">
      {onClick ? (
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={rowClass}
        >
          {inner}
        </button>
      ) : (
        <div className={rowClass}>{inner}</div>
      )}
    </li>
  )
}
