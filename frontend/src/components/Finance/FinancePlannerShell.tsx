import type { ReactNode } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { FinanceMonthStrip } from './FinanceMonthStrip'
import type { FinanceMonthNavBounds } from '../../lib/financeMonthOutlook'
import {
  AXEL_BTN_PRIMARY,
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
  monthBounds: FinanceMonthNavBounds
  onMonthSelect: (offset: number) => void
  tabs: FinanceTab[]
  activeTab: string
  onTabChange: (id: string) => void
  onManageCategories: () => void
  onNewTransaction: () => void
  showNewTransactionFab?: boolean
  children: ReactNode
}

export function FinancePlannerShell({
  monthLabel,
  monthOffset,
  monthBounds,
  onMonthSelect,
  tabs,
  activeTab,
  onTabChange,
  onManageCategories,
  onNewTransaction,
  showNewTransactionFab = true,
  children,
}: FinancePlannerShellProps)
{
  const showMonthStrip = monthBounds.maxOffset > monthBounds.minOffset

  return (
    <div className={`${AXEL_PAGE_SHELL} px-3 sm:px-4 lg:px-6 xl:px-8 relative pt-2 sm:pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6`}>
      <header className="flex items-center justify-between gap-2 pb-2 border-b border-line">
        <div className="min-w-0">
          <h1 className={`text-base sm:text-lg font-display font-semibold ${AXEL_TEXT_PRIMARY}`}>
            Finanças
          </h1>
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            {monthLabel}
            {monthOffset > 0 && ' · previsão'}
            {monthOffset < 0 && ' · histórico'}
          </p>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onManageCategories}
            className="p-1.5 rounded-sl border border-line hover:bg-chrome text-ink-muted"
            aria-label="Categorias"
            title="Categorias"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="rounded-sl border border-zinc-200/80 dark:border-line bg-white dark:bg-chrome shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none -mx-0.5 px-1 mb-3">
        <nav className="flex gap-0.5 overflow-x-auto scrollbar-none py-2 px-0.5" aria-label="Seções financeiras">
          {tabs.map(({ id, label, icon: Icon }) =>
          {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={[
                  'shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase tracking-wide sl-touch transition-colors',
                  active
                    ? 'font-semibold border bg-zinc-100 text-zinc-900 border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:bg-accent-muted dark:text-accent dark:border-accent/30 dark:shadow-none'
                    : 'text-zinc-500 border border-transparent bg-transparent hover:text-zinc-700 dark:text-ink-muted dark:hover:bg-elevated dark:hover:text-ink',
                ].join(' ')}
              >
                <Icon className="w-3 h-3" strokeWidth={1.75} />
                {label}
              </button>
            )
          })}
        </nav>

        {showMonthStrip && (
          <div className="border-t border-line px-0.5 pb-1">
            <FinanceMonthStrip
              monthOffset={monthOffset}
              bounds={monthBounds}
              onSelect={onMonthSelect}
            />
          </div>
        )}
      </div>

      <div className="min-w-0 pt-1">{children}</div>

      {showNewTransactionFab && (
        <button
          type="button"
          onClick={onNewTransaction}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 z-40 inline-flex items-center justify-center gap-1 min-h-[40px] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wide shadow-md ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Lançamento</span>
          <span className="sm:hidden">Novo</span>
        </button>
      )}
    </div>
  )
}
