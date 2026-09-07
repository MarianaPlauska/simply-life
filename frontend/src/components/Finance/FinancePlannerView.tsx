import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  createDefaultPeriodConfig,
  filterTransactionsByPeriod,
  resolveFinancePeriod,
  shiftPeriodConfig,
  type FinancePeriodConfig,
} from '../../lib/financePeriodFilter';
import { useFinancePlannerInit } from '../../hooks/useFinancePlannerInit';
import { useFinanceHideValues } from '../../hooks/useFinanceHideValues';
import { useCashPosition } from '../../hooks/useCashPosition';
import { useFinanceDueNotifications } from '../../hooks/useFinanceDueNotifications';
import {
  FINANCE_MAIN_TABS,
  FINANCE_SUB_TABS,
  navigateToLeaf,
  resolveLeafTab,
  defaultSubForGroup,
  type PlannerGroup,
  type PlannerLeafTab,
} from '../../lib/financePlannerNav';
import {
  buildCategoryBudgetRows,
  filterActiveBudgetRows,
} from '../../lib/financeCategoryBudget';
import { useTaskStore } from '../../store/useTaskStore';
import { FinancePlannerShell } from './FinancePlannerShell';
import { FinanceSectionNav } from './FinanceSectionNav';
import { FinanceViewMenu } from './FinanceViewMenu';
import { FinanceCategories } from './FinanceCategories';
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { FinanceTransactionsTab } from './FinanceTransactionsTab';
import { FinanceGoalsTab } from './FinanceGoalsTab';
import { VirtualCardsTab } from './VirtualCardsTab';
import { ContasFixasTab } from './ContasFixasTab';
import { FinanceDailyLedgerTab } from './FinanceDailyLedgerTab';
import { FinanceSpreadsheetTab } from './FinanceSpreadsheetTab';
import { FinanceHomeTab } from './FinanceHomeTab';
import { FinancePlanningHub } from './overview/FinancePlanningHub';
import { InvitePartnerPanel } from './partner/InvitePartnerPanel';
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces';
import {
  clampFinanceMonthOffset,
  getFinanceMonthNavBounds,
  canShiftFinanceMonth,
} from '../../lib/financeMonthOutlook';
import { buildFinanceDailyBrief } from '../../lib/financeDailyBrief';
import { FinanceReservedBillsTab } from './FinanceReservedBillsTab';
import { FinanceCashTab } from './FinanceCashTab';
import { dedupeTransactionsForLedger } from '../../lib/financeTransactionDedup';
import { FinanceGoalWizard } from './goals/FinanceGoalWizard';
import { BentoGridSkeleton } from '../ui/Skeleton';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function todayIsoKey(): string
{
  return new Date().toISOString().slice(0, 10)
}

function monthOffsetFromDayKey(dayKey: string): number
{
  const d = new Date(`${dayKey}T12:00:00`)
  const now = new Date()
  return (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
}

export function FinancePlannerView() {
  const transactions = useTaskStore((s) => s.transactions);
  const budgetLimits = useTaskStore((s) => s.budgetLimits);
  const setBudgetLimit = useTaskStore((s) => s.setBudgetLimit);
  const categories = useTaskStore((s) => s.categories);
  const financialGoals = useTaskStore((s) => s.financialGoals);
  const updateGoalProgress = useTaskStore((s) => s.updateGoalProgress);
  const cashAccount = useTaskStore((s) => s.cashAccount);
  const reservedBills = useTaskStore((s) => s.reservedBills);
  const contasFixas = useTaskStore((s) => s.contasFixas);
  const cards = useTaskStore((s) => s.cards);
  const { computed: computedCashPosition, display: cashPosition } = useCashPosition();

  const { loading: financeLoading } = useFinancePlannerInit();
  const { hidden: hideValues, toggle: toggleHideValues } = useFinanceHideValues();
  useFinanceDueNotifications(true);

  const [navGroup, setNavGroup] = useState<PlannerGroup>('inicio');
  const [leafTab, setLeafTab] = useState<PlannerLeafTab>('inicio');

  const activeLeaf = resolveLeafTab(navGroup, leafTab);

  const goToGroup = (group: PlannerGroup) =>
  {
    setNavGroup(group);
    const def = defaultSubForGroup(group);
    if (def) setLeafTab(def);
    // Abrir Movimentos já no Diário de hoje, sem chrome extra
    if (group === 'movimentos')
    {
      setDayKey(todayIsoKey());
      setMonthOffset(0);
    }
  };

  const goToLeaf = (leaf: PlannerLeafTab) =>
  {
    const target = navigateToLeaf(leaf);
    setNavGroup(target.group);
    setLeafTab(target.sub);
  };
  const setNewTransactionOpen = useTaskStore((s) => s.setNewTransactionModalOpen);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [dayKey, setDayKey] = useState(todayIsoKey);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingBudget, setEditingBudget] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editingMeta, setEditingMeta] = useState<number | null>(null);
  const [metaEditVal, setMetaEditVal] = useState('');
  const [periodConfig, setPeriodConfig] = useState<FinancePeriodConfig>(() => createDefaultPeriodConfig(0));
  const [searchParams, setSearchParams] = useSearchParams();
  const [deepLinkCardId, setDeepLinkCardId] = useState<string | null>(null);

  useEffect(() =>
  {
    const cardId = searchParams.get('cartao');
    const aba = searchParams.get('aba');
    if (cardId)
    {
      const target = navigateToLeaf('cartoes');
      setNavGroup(target.group);
      setLeafTab(target.sub);
      setDeepLinkCardId(cardId);
      setSearchParams((prev) =>
      {
        const next = new URLSearchParams(prev);
        next.delete('cartao');
        return next;
      }, { replace: true });
      return;
    }
    if (aba === 'faturas' || aba === 'pagos' || aba === 'orcamentos')
    {
      const target = navigateToLeaf(
        aba === 'pagos' ? 'pagos' : aba === 'orcamentos' ? 'orcamentos' : 'faturas',
      );
      setNavGroup(target.group);
      setLeafTab(target.sub);
      setSearchParams((prev) =>
      {
        const next = new URLSearchParams(prev);
        next.delete('aba');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() =>
  {
    setPeriodConfig((c) => ({ ...c, monthOffset }));
  }, [monthOffset]);

  const resolvedPeriod = useMemo(
    () => resolveFinancePeriod(periodConfig),
    [periodConfig],
  );

  const periodTx = useMemo(
    () => filterTransactionsByPeriod(transactions, periodConfig),
    [transactions, periodConfig],
  );

  const activeCategories = useMemo(() => {
    return categories.length > 0 ? categories : [];
  }, [categories]);

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`;

  const monthTx = useMemo(() => {
    const currentDate = new Date();
    const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset, 1);
    const m = targetDate.getMonth();
    const y = targetDate.getFullYear();
    return transactions.filter((t) => {
      const d = new Date(t.data + 'T12:00:00');
      return d.getMonth() === m && d.getFullYear() === y;
    });
  }, [transactions, monthOffset]);

  const prevMonthTx = useMemo(() => {
    const currentDate = new Date();
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset - 1, 1);
    const pm = prevDate.getMonth();
    const py = prevDate.getFullYear();
    return transactions.filter((t) => {
      const d = new Date(t.data + 'T12:00:00');
      return d.getMonth() === pm && d.getFullYear() === py;
    });
  }, [transactions, monthOffset]);

  const receita = monthTx
    .filter((t) => t.tipo === 'receita' && (t.status_pagamento === 'pago' || !t.status_pagamento))
    .reduce((s, t) => s + t.valor, 0);
  const despesas = useMemo(() =>
    dedupeTransactionsForLedger(monthTx)
      .filter((t) => t.tipo === 'despesa' && t.status_pagamento === 'pago')
      .reduce((s, t) => s + t.valor, 0),
  [monthTx]);
  const saldo = receita - despesas;

  const prevDespesas = prevMonthTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const diffDespesas = despesas - prevDespesas;
  const diffDespesasPct = prevDespesas > 0 ? (diffDespesas / prevDespesas) * 100 : 0;

  const budgetRows = useMemo(
    () => buildCategoryBudgetRows(activeCategories, budgetLimits, monthTx),
    [activeCategories, budgetLimits, monthTx],
  );

  const budgetRowsTracked = useMemo(
    () => filterActiveBudgetRows(budgetRows),
    [budgetRows],
  );

  const totalBudget = useMemo(
    () => budgetRowsTracked.reduce((s, b) => s + b.limite, 0),
    [budgetRowsTracked],
  );
  const totalBudgetSpend = useMemo(
    () => budgetRowsTracked.reduce((s, b) => s + b.gasto, 0),
    [budgetRowsTracked],
  );
  const budgetUsedPct = totalBudget > 0 ? (totalBudgetSpend / totalBudget) * 100 : 0;

  const planningHojeLines = useMemo(() =>
  {
    if (monthOffset !== 0) return [] as string[]
    return buildFinanceDailyBrief({
      transactions,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      contasFixas,
      cards,
      categories: activeCategories,
      budgetLimits,
    }).hojeLines
  }, [
    monthOffset,
    transactions,
    cashAccount.saldo_inicial,
    reservedBills,
    contasFixas,
    cards,
    activeCategories,
    budgetLimits,
  ])

  // Maiores categorias (Resumo)
  const categoryTotals = useMemo(() => {
    const map: Record<number, number> = {};
    monthTx.filter(t => t.tipo === 'despesa' && t.categoria_id).forEach(t => {
      map[t.categoria_id!] = (map[t.categoria_id!] || 0) + t.valor;
    });
    return Object.entries(map)
      .map(([id, total]) => ({ id: parseInt(id), total }))
      .sort((a, b) => b.total - a.total);
  }, [monthTx]);

  const biggestCategory = categoryTotals[0] ? (activeCategories.find(c => c.id === categoryTotals[0].id) ?? null) : null;

  const areaChartData = useMemo(() => {
    const currentDate = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + monthOffset - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const mTx = transactions.filter((t) => {
        const td = new Date(t.data + 'T12:00:00');
        return td.getMonth() === m && td.getFullYear() === y;
      });
      const rec = mTx.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
      const desp = mTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
      data.push({ mes: MONTHS[m].slice(0, 3), receita: rec, gastos: desp });
    }
    return data;
  }, [transactions, monthOffset]);

  const pieChartData = useMemo(() => {
    return categoryTotals.map(ct => {
      const cat = activeCategories.find(c => c.id === ct.id);
      return {
        name: cat?.nome || 'Outros',
        value: ct.total,
        color: cat?.cor || '#52525b'
      };
    });
  }, [categoryTotals, activeCategories]);

  const monthBounds = useMemo(
    () => getFinanceMonthNavBounds(transactions),
    [transactions],
  );

  useEffect(() =>
  {
    setMonthOffset((m) => clampFinanceMonthOffset(m, monthBounds));
  }, [monthBounds]);

  const handleSaveBudget = (catId: number, name: string) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) return;
    setBudgetLimit(name, val, catId);
    setEditingBudget(null);
  };

  const subTabs = navGroup === 'contas' || navGroup === 'analise'
    ? FINANCE_SUB_TABS[navGroup]
    : undefined;
  const showFinanceSkeleton = financeLoading;

  const applyDayKey = (key: string) =>
  {
    setDayKey(key);
    setMonthOffset(clampFinanceMonthOffset(monthOffsetFromDayKey(key), monthBounds));
  };

  const applyMonthOffset = (offset: number) =>
  {
    setMonthOffset(clampFinanceMonthOffset(offset, monthBounds));
  };

  return (
    <FinancePlannerShell
      monthOffset={monthOffset}
      tabs={FINANCE_MAIN_TABS}
      activeTab={navGroup}
      onTabChange={(id) => goToGroup(id as PlannerGroup)}
      onManageCategories={() => setShowCatModal(true)}
      hideValues={hideValues}
      onToggleHideValues={toggleHideValues}
      viewMenu={(
        <FinanceViewMenu
          monthOffset={monthOffset}
          monthBounds={monthBounds}
          monthLabel={monthLabel}
          dayKey={dayKey}
          activeLeaf={activeLeaf}
          showFormats={navGroup === 'movimentos'}
          onSelectToday={() =>
          {
            applyDayKey(todayIsoKey());
            if (navGroup === 'movimentos') setLeafTab('diario');
          }}
          onSelectThisMonth={() =>
          {
            applyMonthOffset(0);
            if (navGroup === 'movimentos') setLeafTab('tabela');
          }}
          onSelectMonth={(offset) =>
          {
            applyMonthOffset(offset);
            if (navGroup === 'movimentos') setLeafTab('tabela');
          }}
          onSelectDay={(key) =>
          {
            applyDayKey(key);
            goToLeaf('diario');
          }}
          onSelectFormat={(leaf) => setLeafTab(leaf)}
        />
      )}
    >
      {showFinanceSkeleton ? (
        <BentoGridSkeleton variant="finance" />
      ) : (
      <>
      {subTabs && (
        <FinanceSectionNav
          tabs={subTabs}
          activeId={activeLeaf}
          onChange={(id) => setLeafTab(id as PlannerLeafTab)}
        />
      )}
      {monthOffset > 0 && (
        <div className="rounded-sl border border-accent/35 bg-accent/10 px-3 py-2.5 mb-1">
          <p className="font-mono text-[10px] uppercase text-accent">
            Modo previsão · {monthLabel}
            {monthOffset > 1 && ' · encadeado'}
          </p>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Estimativas com receitas recorrentes, contas fixas e faturas - meses distantes usam projeção encadeada.
          </p>
        </div>
      )}

      {monthOffset < 0 && (
        <div className="rounded-sl border border-line bg-chrome/30 px-3 py-2.5 mb-1">
          <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Histórico · {monthLabel}
          </p>
          <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Lançamentos reais do período - compare com o que estava previsto nas fixas e recorrentes.
          </p>
        </div>
      )}

      {activeLeaf === 'inicio' && (
        <FinanceHomeTab
          monthLabel={monthLabel}
          monthOffset={monthOffset}
          receita={receita}
          despesas={despesas}
          saldo={saldo}
          transactions={transactions}
          monthTransactions={monthTx}
          hideValues={hideValues}
          onNavigate={(t) => goToLeaf(t as PlannerLeafTab)}
        />
      )}

      {activeLeaf === 'visao-geral' && (
        <FinanceOverviewTab
          monthOffset={monthOffset}
          receita={receita}
          despesas={despesas}
          saldo={saldo}
          diffDespesas={diffDespesas}
          diffDespesasPct={diffDespesasPct}
          biggestCategory={biggestCategory}
          categoryTotals={categoryTotals}
          pieChartData={pieChartData}
          areaChartData={areaChartData}
          budgetUsedPct={budgetUsedPct}
          budgetRows={budgetRowsTracked}
          monthTx={monthTx}
          activeCategories={activeCategories}
          editingBudget={editingBudget}
          setEditingBudget={setEditingBudget}
          editVal={editVal}
          setEditVal={setEditVal}
          handleSaveBudget={handleSaveBudget}
          setTab={(t) => goToLeaf(t as PlannerLeafTab)}
        />
      )}

      {activeLeaf === 'orcamentos' && (
        <FinancePlanningHub
          monthLabel={monthLabel}
          monthOffset={monthOffset}
          onMonthOffset={(offset) => applyMonthOffset(offset)}
          canGoPrev={canShiftFinanceMonth(monthOffset, -1, monthBounds)}
          canGoNext={canShiftFinanceMonth(monthOffset, 1, monthBounds)}
          budgetUsedPct={budgetUsedPct}
          budgetRows={budgetRows}
          editingBudget={editingBudget}
          setEditingBudget={setEditingBudget}
          editVal={editVal}
          setEditVal={setEditVal}
          handleSaveBudget={handleSaveBudget}
          hojeLines={planningHojeLines}
        />
      )}

      {activeLeaf === 'diario' && (
        <FinanceDailyLedgerTab
          transactions={transactions}
          activeCategories={activeCategories}
          dayKey={dayKey}
          onDayKeyChange={applyDayKey}
        />
      )}

      {activeLeaf === 'planilha' && (
        <FinanceSpreadsheetTab
          periodLabel={resolvedPeriod.label}
          periodTransactions={periodTx}
          allTransactions={transactions}
          periodConfig={periodConfig}
          onPeriodChange={setPeriodConfig}
          onPeriodShift={(dir) => setPeriodConfig((c) => shiftPeriodConfig(c, dir))}
          activeCategories={activeCategories}
        />
      )}

      {/* ═══════ TABELA DETALHADA ═══════ */}
      {activeLeaf === 'tabela' && (
        <FinanceTransactionsTab
          periodLabel={resolvedPeriod.label}
          periodConfig={periodConfig}
          onPeriodChange={setPeriodConfig}
          onPeriodShift={(dir) => setPeriodConfig((c) => shiftPeriodConfig(c, dir))}
          filterCat={filterCat}
          setFilterCat={setFilterCat}
          activeCategories={activeCategories}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          periodTransactions={periodTx}
          removeTransaction={useTaskStore.getState().removeTransaction}
        />
      )}

      {/* ═══════ METAS DE VIDA ═══════ */}
      {activeLeaf === 'metas' && (
        <FinanceGoalsTab
          financialGoals={financialGoals}
          monthTransactions={monthTx}
          editingMeta={editingMeta}
          setEditingMeta={setEditingMeta}
          metaEditVal={metaEditVal}
          setMetaEditVal={setMetaEditVal}
          updateGoalProgress={updateGoalProgress}
          setShowGoalModal={setShowGoalModal}
          onNavigate={(t) => goToLeaf(t as PlannerLeafTab)}
        />
      )}

      {/* ═══════ CARTÕES & CAIXA ═══════ */}
      {activeLeaf === 'conta' && (
        <div className="space-y-3">
          <FinanceCashTab
            saldoDisponivel={cashPosition.saldoDisponivel}
            reservaRestante={cashPosition.reservaRestante}
            saldoProjetadoDisponivel={cashPosition.saldoProjetadoDisponivel}
            saldoInicial={cashPosition.saldoInicial}
            receitasPagas={cashPosition.receitasPagas}
            despesasPagas={cashPosition.despesasPagas}
            compromissosFixas={cashPosition.compromissosFixas}
            computedDisponivel={computedCashPosition.saldoDisponivel}
            computedReservado={computedCashPosition.reservaRestante}
            computedProjetado={computedCashPosition.saldoProjetadoDisponivel}
            onNewExtraIncome={() => setNewTransactionOpen(true, 'receita')}
          />
          <InvitePartnerPanel />
        </div>
      )}

      {activeLeaf === 'cartoes' && (
        <VirtualCardsTab
          initialCardId={deepLinkCardId}
          openInvoiceOnMount={!!deepLinkCardId}
        />
      )}

      {activeLeaf === 'faturas' && (
        <FinanceReservedBillsTab
          monthLabel={monthLabel}
          viewYear={viewYear}
          viewMonth={viewMonth}
        />
      )}

      {/* ═══════ CONTAS FIXAS ═══════ */}
      {activeLeaf === 'contas-fixas' && (
        <ContasFixasTab />
      )}
      </>
      )}

      <FinanceGoalWizard isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />

      {showCatModal && <FinanceCategories onClose={() => setShowCatModal(false)} />}
    </FinancePlannerShell>
  );
}
