import { useState, useEffect, useMemo } from 'react';
import {
  Settings2, ChevronLeft, ChevronRight, Eye, List, Target, Plus, CreditCard, Receipt
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { PrintButton } from '../ui/PrintButton';
import { FinanceCategories } from './FinanceCategories';
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { FinanceTransactionsTab } from './FinanceTransactionsTab';
import { FinanceGoalsTab } from './FinanceGoalsTab';
import { VirtualCardsTab } from './VirtualCardsTab';
import { ContasFixasTab } from './ContasFixasTab';
import { NewTransactionModal } from './NewTransactionModal';
import { NewGoalModal } from './NewGoalModal';

type PlannerTab = 'visao-geral' | 'tabela' | 'cartoes' | 'metas' | 'contas-fixas';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function FinancePlannerView() {
  const transactions = useTaskStore((s) => s.transactions);
  const budgetLimits = useTaskStore((s) => s.budgetLimits);
  const setBudgetLimit = useTaskStore((s) => s.setBudgetLimit);
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions);
  const fetchCards = useTaskStore((s) => s.fetchCards);

  const categories = useTaskStore((s) => s.categories);
  const fetchCategories = useTaskStore((s) => s.fetchCategories);
  const financialGoals = useTaskStore((s) => s.financialGoals);
  const fetchGoals = useTaskStore((s) => s.fetchGoals);
  const updateGoalProgress = useTaskStore((s) => s.updateGoalProgress);

  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas);
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck);

  const [tab, setTab] = useState<PlannerTab>('visao-geral');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingBudget, setEditingBudget] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editingMeta, setEditingMeta] = useState<number | null>(null);
  const [metaEditVal, setMetaEditVal] = useState('');

  useEffect(() => { 
    fetchTransactions(); 
    fetchCategories();
    fetchGoals();
    fetchCards();
    fetchContasFixas();
    runFinanceCheck();
  }, [fetchTransactions, fetchCategories, fetchGoals, fetchCards, fetchContasFixas, runFinanceCheck]);

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

  const filteredTx = useMemo(() => {
    let result = monthTx;
    if (filterCat !== 'all') {
      if (filterCat === 'receita') result = result.filter((t) => t.tipo === 'receita');
      else result = result.filter((t) => t.categoria_id === parseInt(filterCat) || t.categoria === filterCat);
    }
    if (filterStatus !== 'all') {
      result = result.filter((t) => {
        const sp = (t as any).status_pagamento;
        return sp === filterStatus || (!sp && filterStatus === 'pendente');
      });
    }
    return result;
  }, [monthTx, filterCat, filterStatus]);

  const sorted = useMemo(() => [...filteredTx].sort((a, b) => b.data.localeCompare(a.data)), [filteredTx]);

  const receita = monthTx.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0);
  const despesas = monthTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const saldo = receita - despesas;

  const prevDespesas = prevMonthTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0);
  const diffDespesas = despesas - prevDespesas;
  const diffDespesasPct = prevDespesas > 0 ? (diffDespesas / prevDespesas) * 100 : 0;

  const totalBudget = useMemo(() => budgetLimits.reduce((s, b) => s + b.limite, 0), [budgetLimits]);
  const budgetUsedPct = totalBudget > 0 ? (despesas / totalBudget) * 100 : 0;

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

  const budgetData = activeCategories.filter(c => c.tipo === 'despesa').map((cat) => {
    const gasto = monthTx.filter((t) => t.tipo === 'despesa' && t.categoria_id === cat.id).reduce((s, t) => s + t.valor, 0);
    const limitObj = budgetLimits.find(b => b.categoria_id === cat.id);
    const limite = limitObj?.limite || 0;
    const pct = limite > 0 ? (gasto / limite) * 100 : 0;
    return { ...cat, gasto, limite, pct };
  });

  const handleSaveBudget = (catId: number, name: string) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) return;
    setBudgetLimit(name, val, catId);
    setEditingBudget(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Planejamento Financeiro</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Dashboard de gestão financeira e metas de vida</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="p-2 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] font-semibold text-white min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset((m) => m + 1)} disabled={monthOffset >= 0} className="p-2 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-colors disabled:opacity-30">
            <ChevronRight className="w-4 h-4" />
          </button>
          <PrintButton />
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 pb-px">
        <div className="flex gap-6 w-fit">
          {([
            { id: 'visao-geral' as PlannerTab, label: 'Visão Geral', icon: Eye },
            { id: 'tabela' as PlannerTab, label: 'Lançamentos', icon: List },
            { id: 'cartoes' as PlannerTab, label: 'Cartões & Caixa', icon: CreditCard },
            { id: 'metas' as PlannerTab, label: 'Metas', icon: Target },
            { id: 'contas-fixas' as PlannerTab, label: 'Contas Fixas', icon: Receipt },
          ]).map(({ id, label, icon: TIcon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 pb-3 px-1 text-[12px] font-medium transition-all relative ${
                  isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <TIcon className="w-3.5 h-3.5" />
                {label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                )}
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => setShowCatModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-[12px] text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Gerenciar Categorias
        </button>
      </div>

      {/* ═══════ VISÃO GERAL ═══════ */}
      {tab === 'visao-geral' && (
        <FinanceOverviewTab
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
          budgetData={budgetData}
          monthTx={monthTx}
          activeCategories={activeCategories}
          editingBudget={editingBudget}
          setEditingBudget={setEditingBudget}
          editVal={editVal}
          setEditVal={setEditVal}
          handleSaveBudget={handleSaveBudget}
          setTab={setTab}
          transactions={transactions}
        />
      )}

      {/* ═══════ TABELA DETALHADA ═══════ */}
      {tab === 'tabela' && (
        <FinanceTransactionsTab
          filterCat={filterCat}
          setFilterCat={setFilterCat}
          activeCategories={activeCategories}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sorted={sorted}
          removeTransaction={useTaskStore.getState().removeTransaction}
          filteredTx={filteredTx}
        />
      )}

      {/* ═══════ METAS DE VIDA ═══════ */}
      {tab === 'metas' && (
        <FinanceGoalsTab
          financialGoals={financialGoals}
          editingMeta={editingMeta}
          setEditingMeta={setEditingMeta}
          metaEditVal={metaEditVal}
          setMetaEditVal={setMetaEditVal}
          updateGoalProgress={updateGoalProgress}
          setShowGoalModal={setShowGoalModal}
        />
      )}

      {/* ═══════ CARTÕES & CAIXA ═══════ */}
      {tab === 'cartoes' && (
        <VirtualCardsTab />
      )}

      {/* ═══════ CONTAS FIXAS ═══════ */}
      {tab === 'contas-fixas' && (
        <ContasFixasTab />
      )}

      {/* FAB */}
      <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-white text-zinc-900 text-[13px] font-semibold shadow-lg shadow-black/30 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 z-50">
        <Plus className="w-[18px] h-[18px]" />Novo Lançamento
      </button>

      {/* Slide out Transaction Panel */}
      <NewTransactionModal isOpen={showModal} onClose={() => setShowModal(false)} />

      {/* New Goal Modal */}
      <NewGoalModal isOpen={showGoalModal} onClose={() => setShowGoalModal(false)} />

      {/* Categories Modal */}
      {showCatModal && <FinanceCategories onClose={() => setShowCatModal(false)} />}
    </div>
  );
}
