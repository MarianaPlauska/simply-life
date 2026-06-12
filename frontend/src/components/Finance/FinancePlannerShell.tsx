import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react'
import { canShiftFinanceMonth } from '../../lib/financeMonthOutlook'
import { FinanceMobileTabNav } from './FinanceMobileTabNav'
import { FinanceSubTabBar } from './FinanceSubTabBar'
import type { FinanceSubTab } from '../../lib/financePlannerNav'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_MAIN_PB_MOBILE,
  AXEL_MAIN_PT,
  AXEL_SECTION_TITLE,
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
  onMonthPrev: () => void
  onMonthNext: () => void
  tabs: FinanceTab[]
  activeTab: string
  onTabChange: (id: string) => void
  onManageCategories: () => void
  onNewTransaction: () => void
  subTabs?: FinanceSubTab[]
  activeSubTab?: string
  onSubTabChange?: (id: string) => void
  children: ReactNode
}

export function FinancePlannerShell({
  monthLabel,
  monthOffset,
  onMonthPrev,
  onMonthNext,
  tabs,
  activeTab,
  onTabChange,
  onManageCategories,
  onNewTransaction,
  subTabs,
  activeSubTab,
  onSubTabChange,
  children,
}: FinancePlannerShellProps)
{
  const canGoPrev = canShiftFinanceMonth(monthOffset, -1)
  const canGoNext = canShiftFinanceMonth(monthOffset, 1)

  return (
    <div className={`w-full max-w-6xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4 relative ${AXEL_MAIN_PT} ${AXEL_MAIN_PB_MOBILE}`}>
      <header className="flex flex-col gap-2 sm:gap-3 border-b border-line pb-3 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={`hidden sm:block ${AXEL_SECTION_TITLE}`}>Finanças</p>
            <h1 className={`text-lg sm:text-2xl font-display mt-0 sm:mt-1 ${AXEL_TEXT_PRIMARY}`}>
              Planejamento
            </h1>
            <p className={`hidden sm:block text-[12px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Gastos · cartões · metas · previsão
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={onMonthPrev}
              disabled={!canGoPrev}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sl border border-line hover:bg-chrome text-ink-muted disabled:opacity-30"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className={`font-mono text-[11px] sm:text-[12px] min-w-[96px] sm:min-w-[130px] text-center tabular-nums ${
              monthOffset > 0 ? 'text-accent' : monthOffset < 0 ? 'text-ink-muted' : AXEL_TEXT_PRIMARY
            }`}>
              {monthLabel}
              {monthOffset > 0 && (
                <span className="block text-[8px] uppercase text-accent/80">previsão</span>
              )}
              {monthOffset < 0 && (
                <span className="block text-[8px] uppercase text-ink-muted/80">histórico</span>
              )}
            </span>
            <button
              type="button"
              onClick={onMonthNext}
              disabled={!canGoNext}
              className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-sl border border-line hover:bg-chrome text-ink-muted disabled:opacity-30"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 py-2 bg-fundo/95 backdrop-blur-sm border-b border-line">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="md:hidden w-full space-y-2">
            <FinanceMobileTabNav
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
            />
            <button
              type="button"
              onClick={onManageCategories}
              className="w-full inline-flex items-center justify-center gap-2 min-h-[44px] rounded-sl border border-line text-[11px] font-mono uppercase tracking-wide text-ink-muted hover:bg-chrome hover:text-ink"
            >
              <Settings2 className="w-4 h-4" />
              Categorias
            </button>
          </div>

          <div className="hidden md:flex gap-1.5 flex-1 overflow-x-auto pb-0.5 scrollbar-none snap-x snap-mandatory">
            {tabs.map(({ id, label, icon: Icon }) =>
            {
              const active = activeTab === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onTabChange(id)}
                  className={`snap-start shrink-0 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide transition-all duration-200 ${
                    active ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
                  } hover:border-accent/40 hover:bg-accent/10 hover:text-accent`}
                >
                  <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onManageCategories}
            className="hidden md:inline-flex shrink-0 items-center justify-center gap-2 px-3 py-2 rounded-sl border border-line text-[11px] font-mono uppercase tracking-wide text-ink-muted hover:bg-chrome hover:text-ink"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Categorias
          </button>
        </div>

        {subTabs && subTabs.length > 0 && activeSubTab && onSubTabChange && (
          <FinanceSubTabBar
            tabs={subTabs}
            activeId={activeSubTab}
            onChange={onSubTabChange}
          />
        )}
      </div>

      <div className="min-w-0">{children}</div>

      <button
        type="button"
        onClick={onNewTransaction}
        className={`fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:bottom-8 right-3 sm:right-4 z-40 inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-3 font-mono text-[11px] uppercase tracking-wide shadow-lg ${AXEL_BTN_PRIMARY}`}
      >
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Lançamento</span>
        <span className="sm:hidden">Novo</span>
      </button>
    </div>
  )
}
