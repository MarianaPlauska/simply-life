import { FinanceOverviewCharts } from './FinanceOverviewCharts'
import { FinanceBudgetPanel } from './overview/FinanceBudgetPanel'
import { FinanceRecurringIncomePanel } from './overview/FinanceRecurringIncomePanel'
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
  receita: _receita,
  despesas: _despesas,
  saldo,
  diffDespesas,
  diffDespesasPct,
  biggestCategory,
  categoryTotals,
  pieChartData,
  areaChartData,
  budgetUsedPct,
  budgetRows,
  monthTx: _monthTx,
  activeCategories,
  editingBudget,
  setEditingBudget,
  editVal,
  setEditVal,
  handleSaveBudget,
  setTab,
}: FinanceOverviewTabProps)
{
  void _receita
  void _despesas
  void _monthTx

  return (
    <div className="space-y-3">
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

      <DashboardCollapsible
        title="Orçamento por categoria"
        subtitle="Limites e uso do mês"
        defaultOpen={false}
      >
        <FinanceBudgetPanel
          rows={budgetRows}
          budgetUsedPct={budgetUsedPct}
          editingBudget={editingBudget}
          setEditingBudget={setEditingBudget}
          editVal={editVal}
          setEditVal={setEditVal}
          onSaveBudget={handleSaveBudget}
        />
      </DashboardCollapsible>

      <DashboardCollapsible
        title="Projeção do mês"
        subtitle="Contas e faturas previstas"
        defaultOpen={false}
      >
        <FinanceMonthOutlookPanel monthOffset={monthOffset} />
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
