import { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart,
  Plus, X, Trash2, ArrowUpRight, ArrowDownRight,
  ChevronLeft, ChevronRight, List, Target, Edit3, Check,
  Filter, Eye, CheckCircle2, AlertCircle, CalendarClock,
  Shield, Plane,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { useTaskStore } from '../../store/useTaskStore';
import type { Transaction, BudgetLimit } from '../../store/useTaskStore';

/* -- Category config -- */
const CATEGORIES = [
  { id: 'habitacao', label: 'Habitação', icon: Home, color: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  { id: 'alimentacao', label: 'Alimentação', icon: Utensils, color: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'transporte', label: 'Transporte', icon: Car, color: 'bg-violet-500', text: 'text-violet-400', bg: 'bg-violet-500/10' },
  { id: 'lazer', label: 'Lazer', icon: Gamepad2, color: 'bg-pink-500', text: 'text-pink-400', bg: 'bg-pink-500/10' },
  { id: 'internet', label: 'Internet & Telecom', icon: Wifi, color: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  { id: 'saude', label: 'Saúde', icon: Heart, color: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  { id: 'educacao', label: 'Educação', icon: GraduationCap, color: 'bg-emerald-500', text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { id: 'compras', label: 'Compras Gerais', icon: ShoppingCart, color: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/10' },
] as const;

const CAT_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

type PlannerTab = 'visao-geral' | 'tabela' | 'metas';

const STATUS_CONFIG = {
  pago: { label: 'Pago', icon: CheckCircle2, text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pendente: { label: 'Pendente', icon: AlertCircle, text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  agendado: { label: 'Agendado', icon: CalendarClock, text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const;

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] text-zinc-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className={`text-[13px] font-semibold font-mono ${p.dataKey === 'receita' ? 'text-emerald-400' : 'text-red-400'}`}>
          {p.dataKey === 'receita' ? 'Receita' : 'Gastos'}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const METAS_VIDA = [
  { id: 'emergencia', label: 'Reserva de Emergência', target: 30000, icon: Shield, desc: '6 meses de despesas cobertas' },
  { id: 'investimento', label: 'Investimentos', target: 100000, icon: TrendingUp, desc: 'Portfolio diversificado' },
  { id: 'viagem', label: 'Viagem dos Sonhos', target: 15000, icon: Plane, desc: 'Experiência internacional' },
  { id: 'educacao_meta', label: 'Educação Avançada', target: 25000, icon: GraduationCap, desc: 'MBA ou especialização' },
];

export function FinancePlannerView() {
  const registerInteraction = useTaskStore((s) => s.registerInteraction);
  const transactions = useTaskStore((s) => s.transactions);
  const addTransaction = useTaskStore((s) => s.addTransaction);
  const removeTransaction = useTaskStore((s) => s.removeTransaction);
  const budgetLimits = useTaskStore((s) => s.budgetLimits);
  const setBudgetLimit = useTaskStore((s) => s.setBudgetLimit);
  const fetchTransactions = useTaskStore((s) => s.fetchTransactions);

  const [tab, setTab] = useState<PlannerTab>('visao-geral');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ descricao: '', valor: '', tipo: 'despesa' as 'receita' | 'despesa', categoria: 'habitacao', data: '', status_pagamento: 'pendente' });
  const [monthOffset, setMonthOffset] = useState(0);
  const [filterCat, setFilterCat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [metaProgress, setMetaProgress] = useState<Record<string, number>>({
    emergencia: 0, investimento: 0, viagem: 0, educacao_meta: 0,
  });
  const [editingMeta, setEditingMeta] = useState<string | null>(null);
  const [metaEditVal, setMetaEditVal] = useState('');

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

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

  const filteredTx = useMemo(() => {
    let result = monthTx;
    if (filterCat !== 'all') {
      if (filterCat === 'receita') result = result.filter((t) => t.tipo === 'receita');
      else result = result.filter((t) => t.categoria === filterCat);
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

  const budgetMap = Object.fromEntries(budgetLimits.map((b) => [b.categoria, b.limite]));
  const totalBudget = budgetLimits.reduce((s, b) => s + b.limite, 0);
  const budgetUsedPct = totalBudget > 0 ? (despesas / totalBudget) * 100 : 0;

  const areaChartData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
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
  }, [transactions]);

  const budgetData = CATEGORIES.map((cat) => {
    const gasto = monthTx.filter((t) => t.tipo === 'despesa' && t.categoria === cat.id).reduce((s, t) => s + t.valor, 0);
    const limite = budgetMap[cat.id] || 0;
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
      data: form.data || new Date().toISOString().split('T')[0],
    });
    setForm({ descricao: '', valor: '', tipo: 'despesa', categoria: 'habitacao', data: '', status_pagamento: 'pendente' });
    setShowModal(false);
    registerInteraction('financeiro');
    toast.success(form.tipo === 'receita' ? 'Receita adicionada' : 'Despesa registrada');
  };

  const handleSaveBudget = (catId: string) => {
    const val = parseFloat(editVal);
    if (isNaN(val) || val < 0) return;
    setBudgetLimit(catId, val);
    setEditingBudget(null);
    toast.success('Limite atualizado');
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
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-zinc-900/50 border border-zinc-800/50 rounded-xl w-fit">
        {([
          { id: 'visao-geral' as PlannerTab, label: 'Visão Geral', icon: Eye },
          { id: 'tabela' as PlannerTab, label: 'Tabela Detalhada', icon: List },
          { id: 'metas' as PlannerTab, label: 'Metas de Vida', icon: Target },
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

      {/* ═══════ VISÃO GERAL ═══════ */}
      {tab === 'visao-geral' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center"><ArrowUpRight className="w-[18px] h-[18px] text-emerald-400" /></div>
                  <span className="text-[13px] font-medium text-zinc-400">Receita</span>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500/40" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums font-mono tracking-tight">{fmt(receita)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{monthTx.filter((t) => t.tipo === 'receita').length} entrada{monthTx.filter((t) => t.tipo === 'receita').length !== 1 ? 's' : ''}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center"><ArrowDownRight className="w-[18px] h-[18px] text-red-400" /></div>
                  <span className="text-[13px] font-medium text-zinc-400">Despesas</span>
                </div>
                <TrendingDown className="w-4 h-4 text-red-500/40" />
              </div>
              <p className="text-2xl font-bold text-white tabular-nums font-mono tracking-tight">{fmt(despesas)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{budgetUsedPct > 0 ? `${budgetUsedPct.toFixed(0)}% do orçamento` : 'Sem orçamento definido'}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${saldo >= 0 ? 'bg-violet-500/10' : 'bg-red-500/10'}`}>
                    <DollarSign className={`w-[18px] h-[18px] ${saldo >= 0 ? 'text-violet-400' : 'text-red-400'}`} />
                  </div>
                  <span className="text-[13px] font-medium text-zinc-400">Saldo</span>
                </div>
                <CreditCard className="w-4 h-4 text-zinc-700" />
              </div>
              <p className={`text-2xl font-bold tabular-nums font-mono tracking-tight ${saldo >= 0 ? 'text-white' : 'text-red-400'}`}>{fmt(saldo)}</p>
              <p className="text-[11px] text-zinc-500 mt-1">{saldo >= 0 ? 'Positivo' : 'Negativo'} este mês</p>
            </div>
          </div>

          {/* Area Chart */}
          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[15px] font-semibold text-white">Evolução Financeira</h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">Receita vs. gastos nos últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Receita</span>
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-400"><span className="w-2.5 h-2.5 rounded-full bg-red-400" />Gastos</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={areaChartData}>
                <defs>
                  <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} fill="url(#gradReceita)" />
                <Area type="monotone" dataKey="gastos" stroke="#f87171" strokeWidth={2} fill="url(#gradGastos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Budget + Recent */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-[14px] font-semibold text-white">Orçamento por Categoria</h2>
                <span className={`text-[12px] font-bold tabular-nums font-mono ${budgetUsedPct > 90 ? 'text-red-400' : budgetUsedPct > 70 ? 'text-amber-400' : 'text-zinc-300'}`}>{budgetUsedPct.toFixed(0)}% usado</span>
              </div>
              <div className="space-y-4">
                {budgetData.filter((c) => c.gasto > 0 || c.limite > 0).map((cat) => {
                  const CatIcon = cat.icon;
                  const isOver = cat.pct > 100;
                  const isWarning = cat.pct > 80 && !isOver;
                  const barColor = isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : cat.color;
                  const isEditing = editingBudget === cat.id;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-md ${cat.bg} flex items-center justify-center`}><CatIcon className={`w-3 h-3 ${cat.text}`} /></div>
                          <span className="text-[12px] text-zinc-300">{cat.label}</span>
                        </div>
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-zinc-500">R$</span>
                            <input type="number" value={editVal} onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveBudget(cat.id); if (e.key === 'Escape') setEditingBudget(null); }} className="w-20 bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-2 py-1 text-[12px] text-white font-mono outline-none focus:ring-1 focus:ring-violet-500/40" autoFocus />
                            <button onClick={() => handleSaveBudget(cat.id)} className="p-1 rounded-lg hover:bg-zinc-800 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingBudget(cat.id); setEditVal(String(cat.limite)); }} className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                            <Edit3 className="w-3 h-3" />{fmt(cat.gasto)} / {fmt(cat.limite)}
                          </button>
                        )}
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800/60 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(cat.pct, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
                {budgetData.filter((c) => c.gasto > 0 || c.limite > 0).length === 0 && (
                  <p className="text-[12px] text-zinc-600 text-center py-8">Nenhum gasto neste mês</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/30">
                <h3 className="text-[13px] font-semibold text-white">Últimos Lançamentos</h3>
                <button onClick={() => setTab('tabela')} className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors">Ver todos</button>
              </div>
              <div className="divide-y divide-zinc-800/20">
                {monthTx.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4).map((t) => {
                  const cat = CAT_MAP[t.categoria];
                  const CatIcon = cat?.icon || DollarSign;
                  const isRec = t.tipo === 'receita';
                  return (
                    <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isRec ? 'bg-emerald-500/10' : (cat?.bg || 'bg-zinc-800/60')}`}>
                        <CatIcon className={`w-3.5 h-3.5 ${isRec ? 'text-emerald-400' : (cat?.text || 'text-zinc-400')}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-zinc-200 truncate">{t.descricao}</p>
                        <p className="text-[10px] text-zinc-600">{fmtDate(t.data)}</p>
                      </div>
                      <span className={`text-[12px] font-medium tabular-nums font-mono ${isRec ? 'text-emerald-400' : 'text-zinc-300'}`}>
                        {isRec ? '+' : '-'}{fmt(t.valor)}
                      </span>
                    </div>
                  );
                })}
                {monthTx.length === 0 && <p className="text-[12px] text-zinc-600 text-center py-6">Nenhum lançamento este mês</p>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ═══════ TABELA DETALHADA ═══════ */}
      {tab === 'tabela' && (
        <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 overflow-hidden">
          <div className="flex items-center gap-4 px-6 py-3.5 border-b border-zinc-800/30">
            <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <div className="flex gap-1.5 overflow-x-auto flex-1">
              <button onClick={() => setFilterCat('all')} className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${filterCat === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>Todos</button>
              <button onClick={() => setFilterCat('receita')} className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${filterCat === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}>Receitas</button>
              {CATEGORIES.map((cat) => (
                <button key={cat.id} onClick={() => setFilterCat(cat.id)} className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${filterCat === cat.id ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>{cat.label.split(' ')[0]}</button>
              ))}
            </div>
            <div className="flex gap-1.5 shrink-0 border-l border-zinc-800/30 pl-4">
              {(['all', 'pago', 'pendente', 'agendado'] as const).map((st) => (
                <button key={st} onClick={() => setFilterStatus(st)} className={`px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${filterStatus === st ? 'bg-zinc-700/60 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  {st === 'all' ? 'Status' : STATUS_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[80px_36px_1fr_100px_80px_100px_32px] gap-3 px-6 py-2.5 border-b border-zinc-800/20 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            <span>Data</span><span></span><span>Descrição</span><span>Categoria</span><span>Status</span><span className="text-right">Valor</span><span></span>
          </div>

          <div className="max-h-[520px] overflow-y-auto divide-y divide-zinc-800/15">
            {sorted.map((t) => {
              const cat = CAT_MAP[t.categoria];
              const CatIcon = cat?.icon || DollarSign;
              const isRec = t.tipo === 'receita';
              const statusKey = ((t as Transaction & { status_pagamento?: string }).status_pagamento || 'pendente') as keyof typeof STATUS_CONFIG;
              const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendente;
              const StatusIcon = status.icon;
              return (
                <div key={t.id} className="grid grid-cols-[80px_36px_1fr_100px_80px_100px_32px] gap-3 items-center px-6 py-3 hover:bg-zinc-800/20 transition-colors group">
                  <span className="text-[12px] text-zinc-500 tabular-nums">{fmtDate(t.data)}</span>
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isRec ? 'bg-emerald-500/10' : (cat?.bg || 'bg-zinc-800/60')}`}>
                    <CatIcon className={`w-3.5 h-3.5 ${isRec ? 'text-emerald-400' : (cat?.text || 'text-zinc-400')}`} />
                  </div>
                  <span className="text-[13px] text-zinc-200 truncate">{t.descricao}</span>
                  <span className="text-[11px] text-zinc-500">{isRec ? 'Receita' : (cat?.label || '-')}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${status.text}`}>
                    <StatusIcon className="w-3 h-3" />{status.label}
                  </span>
                  <span className={`text-[13px] font-medium tabular-nums font-mono text-right ${isRec ? 'text-emerald-400' : 'text-zinc-200'}`}>
                    {isRec ? '+' : '-'}{fmt(t.valor)}
                  </span>
                  <button onClick={() => removeTransaction(t.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5" aria-label="Remover">
                    <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              );
            })}
            {sorted.length === 0 && <p className="text-[12px] text-zinc-600 text-center py-12">Nenhum lançamento encontrado para estes filtros.</p>}
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-800/30 bg-zinc-900/30">
            <span className="text-[11px] text-zinc-500">{sorted.length} lançamento{sorted.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-emerald-400 font-mono">+{fmt(filteredTx.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0))}</span>
              <span className="text-[11px] text-red-400 font-mono">-{fmt(filteredTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0))}</span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ METAS DE VIDA ═══════ */}
      {tab === 'metas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {METAS_VIDA.map((meta) => {
              const current = metaProgress[meta.id] || 0;
              const pct = Math.min((current / meta.target) * 100, 100);
              const remaining = meta.target - current;
              return (
                <div key={meta.id} className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <meta.icon className="w-6 h-6 text-violet-400" />
                      <div>
                        <h3 className="text-[14px] font-semibold text-white">{meta.label}</h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{meta.desc}</p>
                      </div>
                    </div>
                    <span className={`text-[12px] font-bold tabular-nums font-mono ${pct >= 100 ? 'text-emerald-400' : pct > 50 ? 'text-violet-400' : 'text-zinc-400'}`}>{pct.toFixed(0)}%</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[12px] text-zinc-400 font-mono tabular-nums">{fmt(current)}</span>
                      <span className="text-[11px] text-zinc-600 font-mono tabular-nums">Meta: {fmt(meta.target)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-zinc-800/60 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-emerald-500' : pct > 50 ? 'bg-violet-500' : 'bg-zinc-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  {remaining > 0 ? (
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-zinc-500">Faltam <span className="text-zinc-300 font-medium">{fmt(remaining)}</span> para atingir a meta</p>
                      {editingMeta === meta.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-zinc-500">R$</span>
                          <input type="number" value={metaEditVal} onChange={(e) => setMetaEditVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const v = parseFloat(metaEditVal); if (!isNaN(v) && v >= 0) setMetaProgress((p) => ({ ...p, [meta.id]: Math.min(v, meta.target) })); setEditingMeta(null); } if (e.key === 'Escape') setEditingMeta(null); }} className="w-24 bg-zinc-800/60 border border-zinc-700/40 rounded-lg px-2 py-1 text-[12px] text-white font-mono outline-none focus:ring-1 focus:ring-violet-500/40" autoFocus />
                          <button onClick={() => { const v = parseFloat(metaEditVal); if (!isNaN(v) && v >= 0) setMetaProgress((p) => ({ ...p, [meta.id]: Math.min(v, meta.target) })); setEditingMeta(null); }} className="p-1 rounded-lg hover:bg-zinc-800 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingMeta(meta.id); setMetaEditVal(String(current)); }} className="text-[11px] text-zinc-600 hover:text-violet-400 transition-colors flex items-center gap-1"><Edit3 className="w-3 h-3" />Atualizar</button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Meta atingida!</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-6">
            <h3 className="text-[14px] font-semibold text-white mb-4">Resumo das Metas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{METAS_VIDA.length}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Metas definidas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{METAS_VIDA.filter((m) => (metaProgress[m.id] || 0) >= m.target).length}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Concluídas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white font-mono tabular-nums">{fmt(Object.values(metaProgress).reduce((s, v) => s + v, 0))}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Total acumulado</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-400 font-mono tabular-nums">{fmt(METAS_VIDA.reduce((s, m) => s + m.target, 0) - Object.values(metaProgress).reduce((s, v) => s + v, 0))}</p>
                <p className="text-[11px] text-zinc-500 mt-1">Faltam</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowModal(true)} className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 rounded-full bg-white text-zinc-900 text-[13px] font-semibold shadow-lg shadow-black/30 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 z-50">
        <Plus className="w-[18px] h-[18px]" />Novo Lançamento
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-white">Novo Lançamento</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"><X className="w-4 h-4 text-zinc-500" /></button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setForm({ ...form, tipo: 'despesa' })} className={`flex-1 py-2 rounded-xl text-[12px] font-medium transition-colors ${form.tipo === 'despesa' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-800/40 text-zinc-500 border border-zinc-700/30'}`}>Despesa</button>
              <button type="button" onClick={() => setForm({ ...form, tipo: 'receita' })} className={`flex-1 py-2 rounded-xl text-[12px] font-medium transition-colors ${form.tipo === 'receita' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800/40 text-zinc-500 border border-zinc-700/30'}`}>Receita</button>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Descrição</label>
              <input type="text" placeholder="Ex: Aluguel, Salário..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition" autoFocus />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Valor (R$)</label>
              <input type="number" min="0.01" step="0.01" placeholder="0,00" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition font-mono" />
            </div>
            {form.tipo === 'despesa' && (
              <>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Categoria</label>
                  <div className="grid grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => {
                      const CatIcon = cat.icon;
                      const selected = form.categoria === cat.id;
                      return (
                        <button key={cat.id} type="button" onClick={() => setForm({ ...form, categoria: cat.id })} className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] transition-colors ${selected ? 'bg-zinc-700/40 border border-zinc-600' : 'bg-zinc-800/30 border border-zinc-800/30 hover:bg-zinc-800/60'}`}>
                          <CatIcon className={`w-4 h-4 ${selected ? 'text-white' : 'text-zinc-500'}`} />
                          <span className={selected ? 'text-zinc-200' : 'text-zinc-500'}>{cat.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Status</label>
                  <div className="flex gap-2">
                    {(['pendente', 'pago', 'agendado'] as const).map((st) => {
                      const cfg = STATUS_CONFIG[st];
                      const StIcon = cfg.icon;
                      return (
                        <button key={st} type="button" onClick={() => setForm({ ...form, status_pagamento: st })} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-medium transition-colors ${form.status_pagamento === st ? `${cfg.bg} ${cfg.text} border ${cfg.border}` : 'bg-zinc-800/40 text-zinc-500 border border-zinc-700/30'}`}>
                          <StIcon className="w-3 h-3" />{cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Data</label>
              <input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition" />
            </div>
            <button onClick={handleAdd} disabled={!form.descricao.trim() || !form.valor} className="w-full py-2.5 rounded-xl bg-white text-zinc-900 text-[13px] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Adicionar {form.tipo === 'receita' ? 'Receita' : 'Despesa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
