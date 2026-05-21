import React from 'react';
import { 
  Wallet, Zap, ArrowRight, Edit3, Check, BarChart3, 
  DollarSign 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';

// Mapa de ícones para exibição dinâmica
import {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Briefcase, Shield, Target
} from 'lucide-react';

import type { Category, Transaction } from '../../store/storeTypes';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Wallet, Shield, Target, Briefcase
};

// Formatação de valores monetários
function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Formatação de datas curtas
function fmtDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Tooltip personalizado para o gráfico de evolução financeira
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-950/90 border border-zinc-900 rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md">
        <p className="text-[11px] text-zinc-500 mb-1.5 font-medium">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} className={`text-[13px] font-semibold font-mono ${p.dataKey === 'receita' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {p.dataKey === 'receita' ? 'Receita' : 'Gastos'}: {fmt(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface CategoryTotal {
  id: number;
  total: number;
}

interface PieChartItem {
  name: string;
  value: number;
  color: string;
}

interface AreaChartItem {
  mes: string;
  receita: number;
  gastos: number;
}

interface BudgetItem {
  id: number;
  nome: string;
  icone: string;
  cor: string;
  gasto: number;
  limite: number;
  pct: number;
}

interface FinanceOverviewTabProps {
  receita: number;
  despesas: number;
  saldo: number;
  diffDespesas: number;
  diffDespesasPct: number;
  biggestCategory: Category | null;
  categoryTotals: CategoryTotal[];
  pieChartData: PieChartItem[];
  areaChartData: AreaChartItem[];
  budgetUsedPct: number;
  budgetData: BudgetItem[];
  monthTx: Transaction[];
  activeCategories: Category[];
  editingBudget: number | null;
  setEditingBudget: (id: number | null) => void;
  editVal: string;
  setEditVal: (v: string) => void;
  handleSaveBudget: (catId: number, name: string) => void;
  setTab: (tab: 'visao-geral' | 'tabela' | 'metas') => void;
}

export function FinanceOverviewTab({
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
  budgetData,
  monthTx,
  activeCategories,
  editingBudget,
  setEditingBudget,
  editVal,
  setEditVal,
  handleSaveBudget,
  setTab,
}: FinanceOverviewTabProps) {
  return (
    <>
      {/* Indicadores de Sumário Flat - Sem cards, separados por espaçamento e alinhamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 py-6 border-b border-zinc-900/50">
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Receitas
          </p>
          <p className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{fmt(receita)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Despesas
          </p>
          <p className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{fmt(despesas)}</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${saldo >= 0 ? 'bg-violet-400' : 'bg-rose-400'}`} />
            Saldo Mensal
          </p>
          <p className={`text-3xl font-bold font-mono tracking-tight ${saldo >= 0 ? 'text-violet-400' : 'text-rose-400'}`}>{fmt(saldo)}</p>
        </div>
      </div>

      {/* Resumo do Mês & Insight do JARVIS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900/40">
            <div>
              <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Resumo do Mês</h2>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Análise rápida do seu desempenho financeiro</p>
            </div>
            <BarChart3 className="w-4 h-4 text-zinc-600" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Gasto vs Mês Anterior</p>
                <div className="flex items-baseline gap-2.5 pt-1">
                  <p className={`text-2xl font-bold font-mono ${diffDespesas <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {diffDespesas > 0 ? '+' : ''}{fmt(diffDespesas)}
                  </p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${diffDespesas <= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {diffDespesasPct > 0 ? '+' : ''}{diffDespesasPct.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Maior Categoria</p>
                {biggestCategory ? (
                  <div className="flex items-center gap-2.5 mt-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-900 bg-zinc-900" style={{ color: biggestCategory.cor }}>
                      {React.createElement(ICON_MAP[biggestCategory.icone] || Wallet, { className: 'w-4 h-4' })}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-zinc-200 truncate">{biggestCategory.nome}</p>
                      <p className="text-[11px] text-zinc-500 font-mono font-medium">{fmt(categoryTotals[0].total)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-zinc-600 mt-1">Nenhum gasto registrado</p>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col items-center justify-center py-2">
              <div className="w-full h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1f1f23', borderRadius: '8px', fontSize: '11px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieChartData.slice(0, 4).map((entry, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-[10px] text-zinc-500 font-semibold">{entry.name}</span>
                  </div>
                ))}
                {pieChartData.length > 4 && <span className="text-[10px] text-zinc-600">+{pieChartData.length - 4} mais</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Insight do JARVIS - Glassmorphism Escuro e Roxo Violeta Premium */}
        <div className="border border-violet-900/20 bg-gradient-to-br from-violet-950/20 to-zinc-950/20 p-6 rounded-xl flex flex-col justify-between relative overflow-hidden group shadow-lg shadow-black/10">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 space-y-5 h-full flex flex-col justify-between">
            <div>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <Zap className="w-4 h-4 text-violet-400" />
              </div>
              <h3 className="text-[13px] font-bold text-zinc-200 uppercase tracking-wider">Insight do JARVIS</h3>
              <p className="text-[11px] text-zinc-400 mt-2.5 leading-relaxed font-medium">
                {saldo > 0 ? (
                  "Seu saldo está positivo! Considere investir esse excedente em sua Reserva de Emergência para acelerar sua independência financeira."
                ) : (
                  "Seu saldo está negativo. Tente reduzir gastos em categorias não essenciais no próximo mês para restabelecer o equilíbrio."
                )}
              </p>
            </div>
            <button 
              onClick={() => setTab('metas')}
              className="flex items-center justify-center gap-1.5 w-full py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-semibold transition-all active:scale-95 shadow-md shadow-violet-950/20"
            >
              Ver Metas <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Evolução Financeira - Sem cards, separada por espaçamento */}
      <div className="space-y-4 py-6 border-t border-zinc-900/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Evolução Financeira</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Receita vs. gastos nos últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />Receita
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-zinc-500">
              <span className="w-2 h-2 rounded-full bg-rose-400" />Gastos
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={areaChartData}>
            <defs>
              <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#121214" vertical={false} />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 11, fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#3f3f46', fontSize: 10, fontWeight: 500 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} width={30} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={1.5} fill="url(#gradReceita)" />
            <Area type="monotone" dataKey="gastos" stroke="#f43f5e" strokeWidth={1.5} fill="url(#gradGastos)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Orçamento por Categoria & Últimos Lançamentos - Sem cards, grid invisível */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 py-6 border-t border-zinc-900/50">
        {/* Orçamento por Categoria */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900/40">
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Orçamento por Categoria</h2>
            <span className={`text-[10px] font-bold tabular-nums font-mono ${budgetUsedPct > 90 ? 'text-rose-400' : budgetUsedPct > 70 ? 'text-amber-400' : 'text-zinc-500'}`}>{budgetUsedPct.toFixed(0)}% usado</span>
          </div>
          <div className="space-y-4">
            {budgetData.filter((c) => c.gasto > 0 || c.limite > 0).map((cat) => {
              const CatIcon = ICON_MAP[cat.icone] || Wallet;
              const isOver = cat.pct > 100;
              const isWarning = cat.pct > 80 && !isOver;
              const barColor = isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : '';
              const isEditing = editingBudget === cat.id;
              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center border border-zinc-800 bg-zinc-900" style={{ color: cat.cor }}><CatIcon className="w-3.5 h-3.5" /></div>
                      <span className="text-[12px] font-semibold text-zinc-300">{cat.nome}</span>
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-zinc-500">R$</span>
                        <input 
                          type="number" 
                          value={editVal} 
                          onChange={(e) => setEditVal(e.target.value)} 
                          onKeyDown={(e) => { 
                            if (e.key === 'Enter') {
                              handleSaveBudget(cat.id, cat.nome);
                            } else if (e.key === 'Escape') {
                              setEditingBudget(null);
                            }
                          }} 
                          className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[12px] text-white font-mono outline-none focus:ring-1 focus:ring-violet-500/40" 
                          autoFocus 
                        />
                        <button onClick={() => handleSaveBudget(cat.id, cat.nome)} className="p-1 rounded hover:bg-zinc-900 text-emerald-400"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingBudget(cat.id); setEditVal(String(cat.limite)); }} className="flex items-center gap-1 text-[11px] font-semibold text-zinc-500 hover:text-violet-400 transition-colors">
                        <Edit3 className="w-3 h-3 text-zinc-600" />{fmt(cat.gasto)} / {fmt(cat.limite)}
                      </button>
                    )}
                  </div>
                  <div className="h-[3px] rounded-full bg-zinc-900 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(cat.pct, 100)}%`, backgroundColor: barColor ? undefined : cat.cor }} />
                  </div>
                </div>
              );
            })}
            {budgetData.filter((c) => c.gasto > 0 || c.limite > 0).length === 0 && (
              <p className="text-[12px] text-zinc-600 py-8 text-center">Nenhum orçamento configurado</p>
            )}
          </div>
        </div>

        {/* Últimos Lançamentos */}
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900/40">
            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Últimos Lançamentos</h3>
            <button onClick={() => setTab('tabela')} className="text-[10px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-wider transition-colors">Ver todos</button>
          </div>
          <div className="divide-y divide-zinc-900/40">
            {monthTx.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 4).map((t) => {
              const cat = activeCategories.find(c => c.id === t.categoria_id);
              const CatIcon = cat ? (ICON_MAP[cat.icone] || Wallet) : DollarSign;
              const isRec = t.tipo === 'receita';
              return (
                <div key={t.id} className="flex items-center gap-3 py-3.5 hover:bg-white/[0.01] hover:px-3 -mx-3 rounded-lg transition-all duration-200 group">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-zinc-800/60 bg-zinc-900 group-hover:border-violet-500/30 group-hover:bg-violet-950/20" style={{ color: isRec ? '#34d399' : (cat?.cor || '#71717a') }}>
                    <CatIcon className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-zinc-200 truncate group-hover:text-white transition-colors">{t.descricao}</p>
                    <p className="text-[10px] text-zinc-500 font-medium">{fmtDate(t.data)}</p>
                  </div>
                  <span className={`text-[12px] font-semibold tabular-nums font-mono ${isRec ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {isRec ? '+' : '-'}{fmt(t.valor)}
                  </span>
                </div>
              );
            })}
            {monthTx.length === 0 && <p className="text-[12px] text-zinc-600 py-8 text-center">Nenhum lançamento este mês</p>}
          </div>
        </div>
      </div>
    </>
  );
}
