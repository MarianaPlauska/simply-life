import type { ReactNode } from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { FinanceMonthStrip } from './FinanceMonthStrip'
import type { FinanceMonthNavBounds } from '../../lib/financeMonthOutlook'
import {
  AXEL_BTN_PRIMARY,
  AXEL_NAV_MAIN_ACTIVE,
  AXEL_NAV_MAIN_IDLE,
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
    <div className="w-full max-w-5xl lg:max-w-3xl xl:max-w-4xl mx-auto px-3 sm:px-4 relative pt-2 sm:pt-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6">
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

      {showMonthStrip && (
        <FinanceMonthStrip
          monthOffset={monthOffset}
          bounds={monthBounds}
          onSelect={onMonthSelect}
        />
      )}

      <nav className="flex gap-0.5 overflow-x-auto scrollbar-none py-2 -mx-0.5" aria-label="Seções financeiras">
        {tabs.map(({ id, label, icon: Icon }) =>
        {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={[
                'shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase tracking-wide transition-colors',
                active ? AXEL_NAV_MAIN_ACTIVE : AXEL_NAV_MAIN_IDLE,
              ].join(' ')}
            >
              <Icon className="w-3 h-3" strokeWidth={1.75} />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="min-w-0">{children}</div>

      {showNewTransactionFab && (
        <button
          type="button"
          onClick={onNewTransaction}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 z-40 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 font-mono text-[10px] uppercase tracking-wide shadow-lg ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Lançamento</span>
          <span className="sm:hidden">Novo</span>
        </button>
      )}
    </div>
  )
}
