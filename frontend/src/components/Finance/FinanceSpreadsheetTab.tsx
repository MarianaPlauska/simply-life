import { useMemo, useState } from 'react'
import { FinancePeriodToolbar } from './FinancePeriodToolbar'
import { FinanceSpreadsheetDashboard } from './spreadsheet/FinanceSpreadsheetDashboard'
import { FinanceExcelSpreadsheet } from './spreadsheet/FinanceExcelSpreadsheet'
import { resolveFinancePeriod, type FinancePeriodConfig } from '../../lib/financePeriodFilter'
import {
  buildSpreadsheetLedger,
  summarizeSpreadsheetPeriod,
} from '../../lib/financeSpreadsheetAnalytics'
import type { Category, Transaction } from '../../store/storeTypes'
import { useTaskStore } from '../../store/useTaskStore'

type SheetView = 'painel' | 'excel'

interface FinanceSpreadsheetTabProps
{
  periodLabel: string
  periodTransactions: Transaction[]
  allTransactions: Transaction[]
  periodConfig: FinancePeriodConfig
  onPeriodChange: (config: FinancePeriodConfig) => void
  onPeriodShift: (direction: -1 | 1) => void
  activeCategories: Category[]
  onNewTransaction: () => void
}

export function FinanceSpreadsheetTab({
  periodLabel,
  periodTransactions,
  allTransactions,
  periodConfig,
  onPeriodChange,
  onPeriodShift,
  activeCategories,
  onNewTransaction,
}: FinanceSpreadsheetTabProps)
{
  const [sheetView, setSheetView] = useState<SheetView>('painel')

  const cards = useTaskStore((s) => s.cards)
  const cashAccount = useTaskStore((s) => s.cashAccount)

  const resolvedPeriod = useMemo(
    () => resolveFinancePeriod(periodConfig),
    [periodConfig],
  )

  const summary = useMemo(
    () => summarizeSpreadsheetPeriod(
      periodTransactions,
      resolvedPeriod.start,
      allTransactions,
      cashAccount.saldo_inicial,
    ),
    [periodTransactions, resolvedPeriod.start, allTransactions, cashAccount.saldo_inicial],
  )

  const ledger = useMemo(
    () => buildSpreadsheetLedger(
      periodTransactions,
      activeCategories,
      summary.saldoInicio,
    ),
    [periodTransactions, activeCategories, summary.saldoInicio],
  )

  const sheetTabs: { id: SheetView; label: string }[] = [
    { id: 'painel', label: 'Painel' },
    { id: 'excel', label: 'Planilha' },
  ]

  return (
    <div className="space-y-4">
      <FinancePeriodToolbar
        config={periodConfig}
        resolved={resolvedPeriod}
        onChange={onPeriodChange}
        onShift={onPeriodShift}
      />

      <div className="flex gap-0 border-b border-line overflow-x-auto scrollbar-none">
        {sheetTabs.map(({ id, label }) =>
        {
          const active = sheetView === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSheetView(id)}
              className={[
                'shrink-0 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wide border-b-2 -mb-px transition-colors',
                active
                  ? 'border-[#217346] text-[#217346] bg-[#217346]/8'
                  : 'border-transparent text-ink-muted hover:text-ink hover:bg-chrome/50',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      {sheetView === 'painel' && (
        <FinanceSpreadsheetDashboard
          periodLabel={periodLabel}
          summary={summary}
          onNewTransaction={onNewTransaction}
        />
      )}

      {sheetView === 'excel' && (
        <FinanceExcelSpreadsheet
          periodLabel={periodLabel}
          summary={summary}
          rows={ledger}
          cards={cards}
        />
      )}
    </div>
  )
}
