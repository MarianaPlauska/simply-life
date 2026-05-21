import React from 'react';
import { 
  Wallet, Check, Edit3, DollarSign
} from 'lucide-react';
import { FinanceOverviewCharts } from './FinanceOverviewCharts';
import { Rule503020Section } from './Rule503020Section';
import { CashflowForecast } from './CashflowForecast';

// Mapa de ícones para exibição dinâmica
import {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Shield, Target, Briefcase
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
  transactions: Transaction[];
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
  transactions,
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

      {/* Distribuição 50-30-20 (Sua Meta vs Real) */}
      <Rule503020Section
        receita={receita}
        despesas={despesas}
        monthTx={monthTx}
        activeCategories={activeCategories}
      />

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

      {/* SEÇÃO: PROJEÇÃO DE FLUXO DE CAIXA (CASHFLOW FORECAST) */}
      <div className="space-y-6 py-6 border-t border-zinc-900/50">
        <CashflowForecast transactions={transactions} />
      </div>
    </>
  );
}
