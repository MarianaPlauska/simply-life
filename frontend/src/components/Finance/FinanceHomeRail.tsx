import { Plus } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts'
import { FinanceAlertsPanel } from './goals/FinanceAlertsPanel'
import { FinanceSpendHeatmap } from './FinanceSpendHeatmap'
import { FinanceWorstEnvelope } from './overview/FinanceWorstEnvelope'
import { FinanceMonthCategoryChart } from './FinanceMonthCategoryChart'
import { AXEL_BTN_MD, AXEL_BTN_PRIMARY, AXEL_DESKTOP_RAIL, AXEL_METRIC_HAIRLINE, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { FinanceAlertTab } from '../../lib/financeAlerts'
import type { BudgetLimit, Category, Transaction } from '../../store/storeTypes'
import type { PlannerLeafTab } from '../../lib/financePlannerNav'

interface FinanceHomeRailProps
{
  transactions: Transaction[]
  categories: Category[]
  budgetLimits: BudgetLimit[]
  onNavigate: (tab: PlannerLeafTab | FinanceAlertTab) => void
}

/** Envelope, categorias do mês, heatmap e alertas — rail da Home no xl */
export function FinanceHomeRail({
  transactions,
  categories,
  budgetLimits,
  onNavigate,
}: FinanceHomeRailProps)
{
  const setCaptureOpen = useTaskStore((s) => s.setFinanceQuickCaptureOpen)
  const alerts = useFinanceAlerts(transactions)
  const upcoming = alerts.slice(0, 4)

  return (
    <aside className={`${AXEL_DESKTOP_RAIL} gap-4`} aria-label="Análise e lançamento">
      <section className={AXEL_METRIC_HAIRLINE}>
        <FinanceWorstEnvelope
          categories={categories}
          budgetLimits={budgetLimits}
          monthTransactions={transactions}
          onConfigure={() => onNavigate('visao-geral')}
        />
      </section>
      <section className={AXEL_METRIC_HAIRLINE}>
        <p className={`font-mono text-[9px] uppercase tracking-[0.14em] mb-3 ${AXEL_TEXT_SECONDARY}`}>
          Categorias do mês
        </p>
        <FinanceMonthCategoryChart
          transactions={transactions}
          categories={categories}
        />
      </section>
      <section className={AXEL_METRIC_HAIRLINE}>
        <FinanceSpendHeatmap transactions={transactions} compact />
      </section>
      <section className={AXEL_METRIC_HAIRLINE}>
        <p className={`font-mono text-[9px] uppercase tracking-[0.14em] mb-2 ${AXEL_TEXT_SECONDARY}`}>
          A pagar
        </p>
        <FinanceAlertsPanel alerts={upcoming} compact onNavigate={onNavigate} />
      </section>
      <button
        type="button"
        onClick={() => setCaptureOpen(true)}
        className={`self-start mt-1 ${AXEL_BTN_MD} ${AXEL_BTN_PRIMARY} gap-1.5`}
      >
        <Plus size={16} strokeWidth={2} />
        Lançamento rápido
      </button>
    </aside>
  )
}
