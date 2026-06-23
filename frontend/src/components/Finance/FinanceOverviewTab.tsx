import { FinanceOverviewCharts } from './FinanceOverviewCharts'
import { FinanceOverviewKpis } from './overview/FinanceOverviewKpis'
import { FinanceBudgetPanel } from './overview/FinanceBudgetPanel'
import { FinanceRecurringIncomePanel } from './overview/FinanceRecurringIncomePanel'
import { FinanceRecentTransactions } from './overview/FinanceRecentTransactions'
import { FinanceMonthOutlookPanel } from './overview/FinanceMonthOutlookPanel'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'
import type { Category, Transaction } from '../../store/storeTypes'
import type { CategoryBudgetRow } from '../../lib/financeCategoryBudget'

interface FinanceOverviewTabProps
{
  monthOffset?: number
  receita: number
  despesas: number
  saldo: number
  diffDespesas: number
  diffDespesasPct: number
  biggestCategory: Category | null
  categoryTotals: { id: number; total: number }[]
  pieChartData: { name: string; value: number; color: string }[]
  areaChartData: { mes: string; receita: number; gastos: number }[]
  budgetUsedPct: number
  budgetRows: CategoryBudgetRow[]
  monthTx: Transaction[]
  activeCategories: Category[]
  editingBudget: number | null
  setEditingBudget: (id: number | null) => void
  editVal: string
  setEditVal: (v: string) => void
  handleSaveBudget: (catId: number, name: string) => void
  setTab: (tab: 'visao-geral' | 'tabela' | 'metas') => void
}

export function FinanceOverviewTab({
  monthOffset = 0,
  receita,
  despesas,
  saldo,
  diffDespesas,
  diffDespesasPct,
  biggestCategory,
  categoryTotals,
  pieChartData,
  areaChartData,
  budgetUsedPct,
  budgetRows,
  monthTx,
  activeCategories,
  editingBudget,
  setEditingBudget,
  editVal,
  setEditVal,
  handleSaveBudget,
  setTab,
}: FinanceOverviewTabProps)
{
  return (
    <div className="space-y-3">
      <FinanceMonthOutlookPanel monthOffset={monthOffset} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <FinanceBudgetPanel
          rows={budgetRows}
          budgetUsedPct={budgetUsedPct}
          editingBudget={editingBudget}
          setEditingBudget={setEditingBudget}
          editVal={editVal}
          setEditVal={setEditVal}
          onSaveBudget={handleSaveBudget}
        />
        <FinanceRecentTransactions
          monthTx={monthTx}
          activeCategories={activeCategories}
          onViewAll={() => setTab('tabela')}
        />
      </div>

      <DashboardCollapsible
        title="Gráficos e tendências"
        subtitle="Receitas, gastos e evolução"
        defaultOpen={false}
        bodyClassName="space-y-4"
      >
        <FinanceOverviewKpis receita={receita} despesas={despesas} saldo={saldo} />
        <FinanceOverviewCharts
          saldo={saldo}
          diffDespesas={diffDespesas}
          diffDespesasPct={diffDespesasPct}
          biggestCategory={biggestCategory}
          categoryTotals={categoryTotals}
          pieChartData={pieChartData}
          areaChartData={areaChartData}
          onViewGoals={() => setTab('metas')}
        />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Receitas recorrentes"
        subtitle="Salário e entradas fixas"
        defaultOpen={false}
      >
        <FinanceRecurringIncomePanel activeCategories={activeCategories} />
      </DashboardCollapsible>
    </div>
  )
}
