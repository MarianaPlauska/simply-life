import type { ReactNode } from 'react'
import { Eye, EyeOff, Settings2 } from 'lucide-react'
import { PageIntro } from '../layout/PageIntro'
import {
  AXEL_PAGE_GUTTER,
  AXEL_PAGE_SHELL,
} from '../../constants/axelSurfaces'

interface FinanceTab
{
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

interface FinancePlannerShellProps
{
  monthOffset: number
  tabs: FinanceTab[]
  activeTab: string
  onTabChange: (id: string) => void
  onManageCategories: () => void
  hideValues?: boolean
  onToggleHideValues?: () => void
  viewMenu?: ReactNode
  children: ReactNode
}

export function FinancePlannerShell({
  monthOffset,
  tabs,
  activeTab,
  onTabChange,
  onManageCategories,
  hideValues = false,
  onToggleHideValues,
  viewMenu,
  children,
}: FinancePlannerShellProps)
{
  const periodHint = monthOffset > 0
    ? 'previsão'
    : monthOffset < 0
      ? 'histórico'
      : null

  return (
    <div className={`${AXEL_PAGE_SHELL} ${AXEL_PAGE_GUTTER} relative pt-2 sm:pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6`}>
      <PageIntro
        title="Finanças"
        meta={periodHint ? (
          <span className="font-mono text-[11px] uppercase tracking-wide">{periodHint}</span>
        ) : undefined}
        actions={
          <>
            {viewMenu}
            {onToggleHideValues && (
              <button
                type="button"
                onClick={onToggleHideValues}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-sl border border-line hover:bg-chrome text-ink-muted hover:text-ink"
                aria-label={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
                title={hideValues ? 'Mostrar valores' : 'Ocultar valores'}
              >
                {hideValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              type="button"
              onClick={onManageCategories}
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-sl border border-line hover:bg-chrome text-ink-muted"
              aria-label="Categorias"
              title="Categorias"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </>
        }
        subNav={(
          <nav className="mb-2 flex gap-0.5 overflow-x-auto scrollbar-none border-b border-line -mt-0.5" aria-label="Seções financeiras">
            {tabs.map(({ id, label, icon: Icon }) =>
            {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTabChange(id)}
                  className={[
                    'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-sans min-h-[40px] transition-colors',
                    active
                      ? 'font-semibold text-ink border-b-2 border-ink -mb-px'
                      : 'text-ink-muted border-b-2 border-transparent hover:text-ink',
                  ].join(' ')}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {label}
                </button>
              )
            })}
          </nav>
        )}
      />

      <div className="min-w-0">{children}</div>
    </div>
  )
}
