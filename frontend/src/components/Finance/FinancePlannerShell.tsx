import type { ReactNode } from 'react'
import { Eye, EyeOff, Settings2 } from 'lucide-react'
import {
  AXEL_PAGE_SHELL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface FinanceTab
{
  id: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}

interface FinancePlannerShellProps
{
  monthLabel: string
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
  monthLabel,
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
  return (
    <div className={`${AXEL_PAGE_SHELL} px-3 sm:px-4 lg:px-6 xl:px-8 relative pt-2 sm:pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6`}>
      <header className="flex items-center justify-between gap-2 pb-2 border-b border-line">
        <div className="min-w-0">
          <h1 className={`text-[15px] sm:text-base font-sans font-semibold ${AXEL_TEXT_PRIMARY}`}>
            Finanças
          </h1>
          <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
            {monthLabel}
            {monthOffset > 0 && ' · previsão'}
            {monthOffset < 0 && ' · histórico'}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
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
        </div>
      </header>

      <nav className="mb-3 flex gap-0.5 overflow-x-auto scrollbar-none border-b border-line" aria-label="Seções financeiras">
        {tabs.map(({ id, label, icon: Icon }) =>
        {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={[
                'shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-sans min-h-[44px] transition-colors',
                active
                  ? 'font-semibold text-ink border-b-2 border-ink'
                  : 'text-ink-muted border-b-2 border-transparent hover:text-ink',
              ].join(' ')}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="min-w-0 pt-1">{children}</div>
    </div>
  )
}
