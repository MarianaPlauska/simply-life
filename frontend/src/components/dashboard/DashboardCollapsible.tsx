import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  AXEL_TEXT_PRIMARY,
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
      className={`group sl-panel overflow-hidden ${borderless ? 'border-0' : ''} ${className}`}
      {...(defaultOpen ? { open: true } : {})}
    >
      <summary className="flex items-center gap-2 p-3 sm:p-4 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden">
        {icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {section && (
                <span className="font-mono text-[11px] text-ink tabular-nums shrink-0">
                  {section}
                </span>
              )}
              <p className={`text-sm sm:text-base font-semibold truncate ${AXEL_TEXT_PRIMARY}`}>
                {title}
              </p>
            </div>
            {trailing}
          </div>
          {subtitle && (
            <p className={`text-[13px] sm:text-sm mt-1 font-medium ${AXEL_TEXT_PRIMARY}`}>
              {subtitle}
            </p>
          )}
          {summaryExtra}
        </div>
        <ChevronDown
          size={18}
          className="text-ink shrink-0 transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className={`px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-0 border-t border-line ${bodyClassName}`}>
        {children}
      </div>
    </details>
  )
}
