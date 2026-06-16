import { useMemo } from 'react'
import { BookOpen, Table2, Wallet } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { FinanceCoachCard } from './overview/FinanceCoachCard'
import { computeCashPosition } from '../../lib/financeReservedBills'
import { resolveCashTone, BALANCE_TONE_TEXT } from '../../lib/financeBalanceTone'
import { FinanceMonthKpisRow } from './overview/FinanceMonthKpisRow'
import { FinanceMonthChartsCompact } from './overview/FinanceMonthChartsCompact'
import {
  AXEL_FILTER_PILL_IDLE,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { formatCategoryPath } from '../../lib/financeCategoryTree'
import type { FinanceAlertTab } from '../../lib/financeAlerts'
import { useFinanceAlerts } from '../../hooks/useFinanceAlerts'
import { FinanceAlertsPanel } from './goals/FinanceAlertsPanel'
import { CardQuickSpendStrip } from './CardQuickSpendStrip'
import { FinanceBudgetProgressStrip } from './overview/FinanceBudgetProgressStrip'
import { FinanceUpcomingBillsStrip } from './overview/FinanceUpcomingBillsStrip'
import { FinanceMonthGoalWidget } from './overview/FinanceMonthGoalWidget'
import type { Category, Transaction } from '../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type FinanceSubTab = 'diario' | 'tabela' | 'planilha' | 'cartoes' | 'visao-geral' | 'faturas' | 'config'

interface FinanceHomeTabProps
{
  monthLabel: string
  monthOffset?: number
  receita: number
  despesas: number
  saldo: number
  transactions: Transaction[]
  monthTransactions: Transaction[]
  recentTransactions: Transaction[]
  activeCategories: Category[]
  pieChartData: { name: string; value: number; color: string }[]
  areaChartData: { mes: string; receita: number; gastos: number }[]
  onNavigate: (tab: FinanceSubTab | FinanceAlertTab) => void
  onSetLimits?: () => void
  onConfigure?: () => void
}

export function FinanceHomeTab({
  monthLabel,
  monthOffset = 0,
  receita,
  despesas,
  saldo,
  transactions,
  monthTransactions,
  recentTransactions,
  activeCategories,
  pieChartData,
  areaChartData,
  onNavigate,
  onSetLimits,
  onConfigure,
}: FinanceHomeTabProps)
{
  const isFutureMonth = monthOffset > 0
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const alerts = useFinanceAlerts(monthTransactions)

  const position = useMemo(
    () => computeCashPosition(transactions, cashAccount.saldo_inicial, reservedBills),
    [transactions, cashAccount.saldo_inicial, reservedBills],
  )

  const cashTone = resolveCashTone(position.saldoDisponivel, position.saldoProjetadoDisponivel)
  const recent = recentTransactions.slice(0, 5)

  const navItems = [
    { id: 'diario' as const, label: 'Diário', icon: BookOpen },
    { id: 'tabela' as const, label: 'Lista', icon: Wallet },
    { id: 'planilha' as const, label: 'Planilha', icon: Table2 },
    { id: 'visao-geral' as const, label: 'Análise', icon: Table2 },
  ]

  return (
    <div className="space-y-3">
      <FinanceMonthKpisRow
        saldoDisponivel={position.saldoDisponivel}
        receita={receita}
        despesas={despesas}
        saldoMes={saldo}
        balanceToneClass={BALANCE_TONE_TEXT[cashTone]}
        compact
      />

      <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
        {isFutureMonth ? `Previsão · ${monthLabel}` : monthLabel}
        {' · '}reservado {fmt(position.reservaRestante)}
        {' · '}projetado {fmt(position.saldoProjetadoDisponivel)}
      </p>

      {!isFutureMonth && (
        <FinanceMonthGoalWidget monthTransactions={monthTransactions} monthOffset={monthOffset} />
      )}

      {!isFutureMonth && pieChartData.length > 0 && (
        <FinanceMonthChartsCompact
          pieChartData={pieChartData}
          areaChartData={areaChartData}
        />
      )}

      {!isFutureMonth && <CardQuickSpendStrip />}

      {!isFutureMonth && (
        <FinanceUpcomingBillsStrip onOpenBills={() => onNavigate('faturas')} />
      )}

      {!isFutureMonth && (
        <FinanceBudgetProgressStrip
          categories={activeCategories}
          budgetLimits={budgetLimits}
          monthTransactions={monthTransactions}
          onConfigure={onSetLimits}
        />
      )}

      {alerts.length > 0 && (
        <FinanceAlertsPanel alerts={alerts} compact onNavigate={onNavigate} />
      )}

      {!isFutureMonth && onSetLimits && (
        <FinanceCoachCard
          monthTransactions={monthTransactions}
          onSetLimits={onSetLimits}
          onConfigure={onConfigure}
        />
      )}

      <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onNavigate(id)}
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sl font-mono text-[10px] uppercase ${AXEL_FILTER_PILL_IDLE} hover:bg-chrome`}
          >
            <Icon size={12} className="text-accent" />
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-sl border border-line bg-card p-3">
        <header className="flex items-center justify-between mb-2">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Últimos lançamentos
          </p>
          <button
            type="button"
            onClick={() => onNavigate('diario')}
            className="font-mono text-[9px] uppercase text-accent hover:underline"
          >
            Diário
          </button>
        </header>
        <ul className="divide-y divide-line">
          {recent.length === 0 && (
            <li className={`py-4 text-center text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              Nenhum lançamento ainda
            </li>
          )}
          {recent.map((t) =>
          {
            const cat = t.categoria_id
              ? formatCategoryPath(activeCategories, t.categoria_id)
              : t.categoria
            return (
              <li
                key={t.id}
                className={`flex items-center justify-between gap-2 py-2 ${AXEL_ROW_HOVER}`}
              >
                <div className="min-w-0">
                  <p className={`text-[12px] truncate ${AXEL_TEXT_PRIMARY}`}>{t.descricao}</p>
                  <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                    {t.data.slice(0, 10).split('-').reverse().join('/')}
                    {cat ? ` · ${cat}` : ''}
                  </p>
                </div>
                <span className={`font-mono text-[11px] tabular-nums shrink-0 ${
                  t.tipo === 'receita' ? 'text-concluido' : 'text-urgente'
                }`}>
                  {t.tipo === 'receita' ? '+' : '−'}{fmt(t.valor)}
                </span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
