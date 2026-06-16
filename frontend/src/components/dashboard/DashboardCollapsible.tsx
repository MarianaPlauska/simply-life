import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface DashboardCollapsibleProps
{
  title: string
  subtitle?: string
  section?: string
  defaultOpen?: boolean
  className?: string
  bodyClassName?: string
  icon?: ReactNode
  /** À direita do título (links — use stopPropagation no clique) */
  trailing?: ReactNode
  /** Conteúdo extra no summary, abaixo do título */
  summaryExtra?: ReactNode
  borderless?: boolean
  children: ReactNode
}

// Seção recolhível — chevron consistente em todo o dashboard

export function DashboardCollapsible({
  title,
  subtitle,
  section,
  defaultOpen = false,
  className = '',
  bodyClassName = 'space-y-3',
  icon,
  trailing,
  summaryExtra,
  borderless = false,
  children,
}: DashboardCollapsibleProps)
{
  return (
    <details
      className={`group ${borderless ? '' : 'rounded-sl border border-line bg-card'} ${className}`}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex items-center gap-2 p-2.5 sm:p-3 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {section && (
                <span className="font-mono text-[10px] text-accent tabular-nums shrink-0">
                  {section}
                </span>
              )}
              <p className={`text-[12px] sm:text-sm font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                {title}
              </p>
            </div>
            {trailing}
          </div>
          {subtitle && (
            <p className={`font-mono text-[9px] sm:text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
              {subtitle}
            </p>
          )}
          {summaryExtra}
        </div>
        <ChevronDown
          size={16}
          className="text-ink-muted shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className={`px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-0 border-t border-line ${bodyClassName}`}>
        {children}
      </div>
    </details>
  )
}
