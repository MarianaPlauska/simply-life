import React from 'react';
import { 
  BarChart3, Wallet, Zap, ArrowRight 
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell
} from 'recharts';
import type { Category } from '../../store/storeTypes';

// Mapa de ícones para exibição dinâmica
import {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Briefcase, Shield, Target
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Wallet, Shield, Target, Briefcase
};

// Formatação de valores monetários
function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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

interface CategoryTotal {
  id: number;
  total: number;
}

interface FinanceOverviewChartsProps {
  saldo: number;
  diffDespesas: number;
  diffDespesasPct: number;
  biggestCategory: Category | null;
  categoryTotals: CategoryTotal[];
  pieChartData: PieChartItem[];
  areaChartData: AreaChartItem[];
  onViewGoals: () => void;
}

export function FinanceOverviewCharts({
  saldo,
  diffDespesas,
  diffDespesasPct,
  biggestCategory,
  categoryTotals,
  pieChartData,
  areaChartData,
  onViewGoals,
}: FinanceOverviewChartsProps) {
  return (
    <>
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
                      <p className="text-[11px] text-zinc-500 font-mono font-medium">{fmt(categoryTotals[0]?.total || 0)}</p>
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
              onClick={onViewGoals}
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
    </>
  );
}
