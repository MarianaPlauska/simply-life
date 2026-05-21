
import { 
  Filter, Trash2, CheckCircle2, AlertCircle, CalendarClock, DollarSign, Wallet
} from 'lucide-react';

// Importações locais de ícones para exibição dinâmica
import {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Briefcase, Shield, Target
} from 'lucide-react';

import type { Category, Transaction } from '../../store/storeTypes';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> =
{
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Wallet, Shield, Target, Briefcase
};

const STATUS_CONFIG = {
  pago: { label: 'Pago', icon: CheckCircle2, text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pendente: { label: 'Pendente', icon: AlertCircle, text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  agendado: { label: 'Agendado', icon: CalendarClock, text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const;

function fmt(value: number)
{
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(iso: string)
{
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

interface FinanceTransactionsTabProps
{
  filterCat: string;
  setFilterCat: (cat: string) => void;
  activeCategories: Category[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  sorted: Transaction[];
  removeTransaction: (id: number) => void;
  filteredTx: Transaction[];
}

export function FinanceTransactionsTab({
  filterCat,
  setFilterCat,
  activeCategories,
  filterStatus,
  setFilterStatus,
  sorted,
  removeTransaction,
  filteredTx,
}: FinanceTransactionsTabProps) {
  return (
    <div className="space-y-6">
      {/* Barra de Filtros Minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-zinc-900/50">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <div className="flex gap-1.5">
            <button 
              onClick={() => setFilterCat('all')} 
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${filterCat === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterCat('receita')} 
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${filterCat === 'receita' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Receitas
            </button>
            {activeCategories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setFilterCat(String(cat.id))} 
                className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${filterCat === String(cat.id) ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0 sm:border-l sm:border-zinc-900/50 sm:pl-4">
          {(['all', 'pago', 'pendente', 'agendado'] as const).map((st) => (
            <button 
              key={st} 
              onClick={() => setFilterStatus(st)} 
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors ${filterStatus === st ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {st === 'all' ? 'Status' : STATUS_CONFIG[st].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Lançamentos - Clean, Flat, Sem cards ou caixas pesadas */}
      <div className="space-y-1">
        {/* Cabeçalho */}
        <div className="grid grid-cols-[80px_36px_1fr_120px_90px_100px_32px] gap-3 py-2 border-b border-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>Data</span>
          <span></span>
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Status</span>
          <span className="text-right">Valor</span>
          <span></span>
        </div>

        {/* Linhas de Dados */}
        <div className="divide-y divide-zinc-900/40">
          {sorted.map((t) => {
            const isRec = t.tipo === 'receita';
            const cat = activeCategories.find((c) => c.id === t.categoria_id || c.nome === t.categoria);
            const CatIcon = cat ? (ICON_MAP[cat.icone] || Wallet) : DollarSign;
            
            const statusKey = (t.status_pagamento || 'pendente') as keyof typeof STATUS_CONFIG;
            const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pendente;
            const StatusIcon = status.icon;

            return (
              <div 
                key={t.id} 
                className="grid grid-cols-[80px_36px_1fr_120px_90px_100px_32px] gap-3 items-center py-3.5 hover:bg-white/[0.01] hover:px-3 -mx-3 rounded-lg transition-all duration-200 group"
              >
                <span className="text-[12px] text-zinc-500 tabular-nums">{fmtDate(t.data)}</span>
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center border border-zinc-800/60 bg-zinc-900 group-hover:border-violet-500/30 group-hover:bg-violet-950/20 transition-all" 
                  style={{ color: isRec ? '#34d399' : (cat?.cor || '#71717a') }}
                >
                  <CatIcon className="w-3.5 h-3.5 group-hover:text-violet-400 transition-colors" />
                </div>
                <span className="text-[13px] text-zinc-200 truncate group-hover:text-white transition-colors">{t.descricao}</span>
                <span className="text-[11px] text-zinc-500 font-medium">{isRec ? 'Receita' : (cat?.nome || '-')}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status.text}`}>
                  <StatusIcon className="w-3 h-3" />
                  {status.label}
                </span>
                <span className={`text-[13px] font-semibold tabular-nums font-mono text-right ${isRec ? 'text-emerald-400' : 'text-zinc-200'}`}>
                  {isRec ? '+' : '-'}{fmt(t.valor)}
                </span>
                <button 
                  onClick={() => removeTransaction(t.id)} 
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-600 hover:text-red-400 rounded-lg hover:bg-red-500/10" 
                  aria-label="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {sorted.length === 0 && (
            <p className="text-[12px] text-zinc-600 text-center py-16">Nenhum lançamento encontrado para estes filtros.</p>
          )}
        </div>
      </div>

      {/* Resumo do Rodapé */}
      <div className="flex items-center justify-between py-3 border-t border-zinc-900/50">
        <span className="text-[11px] text-zinc-500 font-medium">{sorted.length} lançamento{sorted.length !== 1 ? 's' : ''}</span>
        <div className="flex items-center gap-6">
          <span className="text-[11px] text-emerald-400 font-mono font-semibold">
            +{fmt(filteredTx.filter((t) => t.tipo === 'receita').reduce((s, t) => s + t.valor, 0))}
          </span>
          <span className="text-[11px] text-rose-400 font-mono font-semibold">
            -{fmt(filteredTx.filter((t) => t.tipo === 'despesa').reduce((s, t) => s + t.valor, 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
