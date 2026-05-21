import { useState, useEffect, useMemo } from 'react';
import {
  Settings2, ChevronLeft, ChevronRight, Eye, List, Target, X, Plus, Wallet, CheckCircle2, AlertCircle, CalendarClock, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import type { Transaction } from '../../store/useTaskStore';
import { PrintButton } from '../ui/PrintButton';
import { FinanceCategories } from './FinanceCategories';
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { FinanceTransactionsTab } from './FinanceTransactionsTab';
import { FinanceGoalsTab } from './FinanceGoalsTab';
import { VirtualCardsTab } from './VirtualCardsTab';

const ICON_MAP: Record<string, any> = {
  Wallet, Target
};

type PlannerTab = 'visao-geral' | 'tabela' | 'cartoes' | 'metas';

const STATUS_CONFIG = {
  pago: { label: 'Pago', icon: CheckCircle2, text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pendente: { label: 'Pendente', icon: AlertCircle, text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  agendado: { label: 'Agendado', icon: CalendarClock, text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const;

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];






// Metas serão carregadas do banco agora

export function FinancePlannerView() {
  const registerInteraction = useTaskStore((s) => s.registerInteraction);
  const transactions = useTaskStore((s) => s.transactions);
  const addTransaction = useTaskStore((s) => s.addTransaction);
  const removeTransaction = useTaskStore((s) => s.removeTransaction);
  const budgetLimits = useTaskStore((s) => s.budgetLimits);
  const setBudgetLimit = useTaskStore((s) => s.setBudgetLimit);
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions);
  const cards = useTaskStore((s) => s.cards) || [];

  const categories = useTaskStore((s) => s.categories);
  const fetchCategories = useTaskStore((s) => s.fetchCategories);
  const financialGoals = useTaskStore((s) => s.financialGoals);
  const fetchGoals = useTaskStore((s) => s.fetchGoals);
  const updateGoalProgress = useTaskStore((s) => s.updateGoalProgress);
  const addGoal = useTaskStore((s) => s.addGoal);

  const [tab, setTab] = useState<PlannerTab>('visao-geral');
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [form, setForm] = useState({ 
    descricao: '', 
    valor: '', 
    tipo: 'despesa' as 'receita' | 'despesa', 
    categoria: '', 
    categoria_id: undefined as number | undefined,
    data: '', 
    status_pagamento: 'pendente',
    card_id: undefined as string | undefined
  });
  const [goalForm, setGoalForm] = useState({ titulo: '', valor_alvo: '', icone: 'Target', cor: '#8b5cf6' });
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
  }, [fetchTransactions, fetchCategories, fetchGoals]);

  // Fallback para categorias caso esteja vazio
  const activeCategories = categories.length > 0 ? categories : [];

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  const monthLabel = `${MONTHS[viewMonth]} ${viewYear}`;

  const monthTx = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.data + 'T12:00:00');
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
  }, [transactions, viewMonth, viewYear]);

  const prevMonthTx = useMemo(() => {
    const prevDate = new Date(now.getFullYear(), now.getMonth() + monthOffset - 1, 1);
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
        const sp = (t as Transaction & { status_pagamento?: string }).status_pagamento;
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

  const biggestCategory = categoryTotals[0] ? activeCategories.find(c => c.id === categoryTotals[0].id) : null;

  const areaChartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() + monthOffset - i, 1);
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

  const handleAdd = async () => {
    if (!form.descricao.trim() || !form.valor) return;
    await addTransaction({
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      categoria: form.tipo === 'receita' ? '-' : form.categoria,
      categoria_id: form.categoria_id,
      data: form.data || new Date().toISOString().split('T')[0],
      status_pagamento: form.status_pagamento as any,
      card_id: form.tipo === 'despesa' ? form.card_id : undefined,
    });
    setForm({ descricao: '', valor: '', tipo: 'despesa', categoria: '', categoria_id: undefined, data: '', status_pagamento: 'pendente', card_id: undefined });
    setShowModal(false);
    registerInteraction('financeiro');
    toast.success(form.tipo === 'receita' ? 'Receita adicionada' : 'Despesa registrada');
  };

  const handleSaveBudget = (catId: number, name: string) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) return;
    setBudgetLimit(name, val, catId);
    setEditingBudget(null);
    toast.success('Limite atualizado');
  };

  const handleAddGoal = async () => {
    if (!goalForm.titulo.trim() || !goalForm.valor_alvo) return;
    await addGoal({
      titulo: goalForm.titulo,
      valor_alvo: parseFloat(goalForm.valor_alvo),
      valor_atual: 0,
      icone: goalForm.icone,
      cor: goalForm.cor,
      concluida: false
    });
    setGoalForm({ titulo: '', valor_alvo: '', icone: 'Target', cor: '#8b5cf6' });
    setShowGoalModal(false);
    toast.success('Meta criada!');
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

      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800/50 rounded-xl w-fit">
          {([
            { id: 'visao-geral' as PlannerTab, label: 'Visão Geral', icon: Eye },
            { id: 'tabela' as PlannerTab, label: 'Lançamentos', icon: List },
            { id: 'cartoes' as PlannerTab, label: 'Cartões & Caixa', icon: CreditCard },
            { id: 'metas' as PlannerTab, label: 'Metas', icon: Target },
          ]).map(({ id, label, icon: TIcon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[12px] font-medium transition-all ${tab === id ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <TIcon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
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
          removeTransaction={removeTransaction}
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

      {/* FAB */}
      <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-white text-zinc-900 text-[13px] font-semibold shadow-lg shadow-black/30 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 z-50">
        <Plus className="w-[18px] h-[18px]" />Novo Lançamento
      </button>

      {/* Panel Lateral deslizante (Side Panel) de Novo Lançamento */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={() => setShowModal(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-zinc-950/95 border-l border-white/[0.04] shadow-2xl backdrop-blur-xl p-6 flex flex-col justify-between transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-6 overflow-y-auto pr-1 scrollbar-none flex-1 pb-6">
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <div>
                  <h3 className="text-[14px] font-bold text-white tracking-wide uppercase">Novo Lançamento</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Insira despesas ou receitas no Simply-Life</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              {/* Tipo: Despesa / Receita */}
              <div className="flex gap-2 p-1 bg-zinc-900/60 border border-white/[0.04] rounded-xl">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'despesa' })}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${form.tipo === 'despesa' ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-md' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, tipo: 'receita' })}
                  className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${form.tipo === 'receita' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md' : 'text-zinc-500 hover:text-zinc-400'}`}
                >
                  Receita
                </button>
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Assinatura OpenAI, Freelance..."
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="w-full bg-zinc-900/40 border border-white/[0.06] rounded-xl px-4 py-2.5 text-[12px] text-white placeholder:text-zinc-650 outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 transition"
                  autoFocus
                />
              </div>

              {/* Valor */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Valor (R$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="w-full bg-zinc-900/40 border border-white/[0.06] rounded-xl px-4 py-2.5 text-[12px] text-white placeholder:text-zinc-650 outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 transition font-mono"
                />
              </div>

              {form.tipo === 'despesa' && (
                <>
                  {/* Categoria */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categoria</label>
                    <div className="grid grid-cols-3 gap-2">
                      {activeCategories.filter(c => c.tipo === 'despesa').map((cat) =>
                      {
                        const CatIcon = ICON_MAP[cat.icone] || Wallet;
                        const selected = form.categoria_id === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setForm({ ...form, categoria: cat.nome, categoria_id: cat.id })}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-all ${selected ? 'bg-white/[0.04] border border-white/[0.12] shadow-lg' : 'bg-zinc-900/30 border border-transparent hover:bg-zinc-900/60'}`}
                          >
                            <CatIcon className="w-3.5 h-3.5" style={{ color: cat.cor }} />
                            <span className={selected ? 'text-zinc-200 font-bold' : 'text-zinc-500'}>{cat.nome.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setShowCatModal(true)}
                        className="flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] bg-zinc-900/30 border border-dashed border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nova</span>
                      </button>
                    </div>
                  </div>

                  {/* Cartão Virtual */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pagar com Cartão Virtual</label>
                    <select
                      value={form.card_id || ''}
                      onChange={(e) => setForm({ ...form, card_id: e.target.value || undefined })}
                      className="w-full bg-zinc-900/40 border border-white/[0.06] rounded-xl px-4 py-2.5 text-[12px] text-white outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40 transition"
                    >
                      <option value="" className="bg-zinc-950 text-zinc-400">Nenhum (Dinheiro/PIX)</option>
                      {cards.map((c) =>
                      {
                        return (
                          <option key={c.id} value={c.id} className="bg-zinc-950 text-white">
                            {c.nome} ({c.numero.slice(-4)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status de Pagamento</label>
                    <div className="flex gap-2">
                      {(['pendente', 'pago', 'agendado'] as const).map((st) =>
                      {
                        const cfg = STATUS_CONFIG[st];
                        const StIcon = cfg.icon;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setForm({ ...form, status_pagamento: st })}
                            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-colors ${form.status_pagamento === st ? `${cfg.bg} ${cfg.text} border ${cfg.border}` : 'bg-zinc-900/40 text-zinc-500 border border-white/[0.02]'}`}
                          >
                            <StIcon className="w-3 h-3" />{cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Data */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Data do Lançamento</label>
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="w-full bg-zinc-900/40 border border-white/[0.06] rounded-xl px-4 py-2.5 text-[12px] text-white outline-none focus:ring-1 focus:ring-violet-500/40 transition"
                />
              </div>
            </div>

            <div className="border-t border-white/[0.04] pt-4 mt-auto">
              <button
                onClick={handleAdd}
                disabled={!form.descricao.trim() || !form.valor}
                className="w-full py-2.5 rounded-xl bg-white text-zinc-950 text-[12px] font-bold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
              >
                Salvar {form.tipo === 'receita' ? 'Receita' : 'Despesa'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowGoalModal(false)}>
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">Nova Meta</h3>
              <button onClick={() => setShowGoalModal(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-4 h-4 text-zinc-500" /></button>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Título da Meta</label>
              <input type="text" placeholder="Ex: Viagem Japão, Novo Macbook..." value={goalForm.titulo} onChange={(e) => setGoalForm({ ...goalForm, titulo: e.target.value })} className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Valor Alvo (R$)</label>
              <input type="number" placeholder="0,00" value={goalForm.valor_alvo} onChange={(e) => setGoalForm({ ...goalForm, valor_alvo: e.target.value })} className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition font-mono" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Cor</label>
              <div className="flex flex-wrap gap-2">
                {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
                  <button key={c} onClick={() => setGoalForm({ ...goalForm, cor: c })} className={`w-6 h-6 rounded-full border-2 ${goalForm.cor === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <button onClick={handleAddGoal} disabled={!goalForm.titulo.trim() || !goalForm.valor_alvo} className="w-full py-2.5 rounded-xl bg-white text-zinc-900 text-[13px] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40">
              Criar Meta
            </button>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {showCatModal && <FinanceCategories onClose={() => setShowCatModal(false)} />}
    </div>
  );
}
