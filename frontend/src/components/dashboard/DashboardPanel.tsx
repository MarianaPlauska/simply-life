import type { ReactNode } from 'react'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_METRIC_HAIRLINE,
  AXEL_LINK,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Cabeçalho padronizado — painéis do dashboard enterprise

interface DashboardPanelProps
{
  section?: string
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPadding?: boolean
  /** Sem caixa — só hairline de métrica */
  hairline?: boolean
}

export function DashboardPanel({
  section,
  title,
  subtitle,
  action,
  children,
  className = '',
  noPadding = false,
  hairline = false,
}: DashboardPanelProps)
{
  const shell = hairline ? AXEL_METRIC_HAIRLINE : AXEL_BORDERLESS_PANEL

  return (
    <section className={`${shell} ${noPadding && !hairline ? 'p-0 overflow-hidden' : ''} ${className}`}>
      <header className={`flex items-start justify-between gap-3 ${
        hairline ? 'mb-2' : noPadding ? 'px-4 pt-4 pb-3 border-b border-line' : 'mb-4'
      }`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {section && (
              <span className="font-mono text-[11px] text-accent tabular-nums">{section}</span>
            )}
            <p className={AXEL_SECTION_TITLE}>{title}</p>
          </div>
          {subtitle && (
            <p className={`font-mono text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>{subtitle}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

interface DashboardPanelLinkProps
{
  label: string
  onClick: () => void
}

export function DashboardPanelLink({ label, onClick }: DashboardPanelLinkProps)
{
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono text-[12px] uppercase tracking-wide ${AXEL_LINK}`}
    >
      {label}
    </button>
  )
}

export function DashboardPanelTitle({ children }: { children: ReactNode })
{
  return (
    <h2 className={`text-lg font-display mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
      {children}
    </h2>
  )
}
