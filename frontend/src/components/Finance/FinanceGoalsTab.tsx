
import { 
  Target, Edit3, Check, CheckCircle2, Plus 
} from 'lucide-react';

// Importações de ícones para exibição dinâmica
import {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Plane, Briefcase, Shield, Wallet
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Wallet, Shield, Target, Plane, Briefcase
};

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface FinanceGoalsTabProps {
  financialGoals: any[];
  editingMeta: number | null;
  setEditingMeta: (id: number | null) => void;
  metaEditVal: string;
  setMetaEditVal: (v: string) => void;
  updateGoalProgress: (id: number, val: number) => void;
  setShowGoalModal: (show: boolean) => void;
}

export function FinanceGoalsTab({
  financialGoals,
  editingMeta,
  setEditingMeta,
  metaEditVal,
  setMetaEditVal,
  updateGoalProgress,
  setShowGoalModal,
}: FinanceGoalsTabProps) {
  return (
    <div className="space-y-12">
      {/* Grid de Metas - Puro Espaçamento, Sem caixas de fundo ou bordas fechadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 py-4">
        {financialGoals.map((meta) => {
          const current = meta.valor_atual;
          const pct = Math.min((current / meta.valor_alvo) * 100, 100);
          const remaining = meta.valor_alvo - current;
          const Icon = ICON_MAP[meta.icone] || Target;
          
          return (
            <div key={meta.id} className="space-y-4 py-2 border-b border-zinc-900/10 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-zinc-800/60 bg-zinc-900" 
                    style={{ color: meta.cor }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-semibold text-zinc-200">{meta.titulo}</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                      {meta.concluida ? 'Meta alcançada!' : 'Progresso contínuo'}
                    </p>
                  </div>
                </div>
                <span className={`text-[12px] font-bold tabular-nums font-mono ${pct >= 100 ? 'text-emerald-400' : pct > 50 ? 'text-violet-400' : 'text-zinc-500'}`}>
                  {pct.toFixed(0)}%
                </span>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[12px] text-zinc-400 font-mono font-semibold tabular-nums">{fmt(current)}</span>
                  <span className="text-[11px] text-zinc-600 font-mono font-semibold tabular-nums">Meta: {fmt(meta.valor_alvo)}</span>
                </div>
                {/* Linha de Progresso Ultra-fina (3px) */}
                <div className="h-[3px] rounded-full bg-zinc-900 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${pct}%`, backgroundColor: meta.cor }} 
                  />
                </div>
              </div>

              {remaining > 0 ? (
                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Faltam <span className="text-zinc-400 font-semibold">{fmt(remaining)}</span>
                  </p>
                  {editingMeta === meta.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-zinc-500">R$</span>
                      <input 
                        type="number" 
                        value={metaEditVal} 
                        onChange={(e) => setMetaEditVal(e.target.value)} 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') {
                            updateGoalProgress(meta.id, parseFloat(metaEditVal)); 
                            setEditingMeta(null); 
                          } else if (e.key === 'Escape') {
                            setEditingMeta(null); 
                          }
                        }} 
                        className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-[12px] text-white font-mono outline-none focus:ring-1 focus:ring-violet-500/40" 
                        autoFocus 
                      />
                      <button 
                        onClick={() => { 
                          updateGoalProgress(meta.id, parseFloat(metaEditVal)); 
                          setEditingMeta(null); 
                        }} 
                        className="p-1 rounded hover:bg-zinc-900 text-emerald-400"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { 
                        setEditingMeta(meta.id); 
                        setMetaEditVal(String(current)); 
                      }} 
                      className="text-[11px] text-zinc-500 hover:text-violet-400 transition-colors flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3 h-3 text-zinc-600" />
                      Atualizar
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Meta atingida!
                </p>
              )}
            </div>
          );
        })}

        {/* Botão de Criação de Meta */}
        <button 
          onClick={() => setShowGoalModal(true)}
          className="rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/10 flex flex-col items-center justify-center p-6 text-zinc-500 hover:text-zinc-400 transition-all min-h-[160px] group active:scale-98"
        >
          <Plus className="w-6 h-6 mb-2 group-hover:scale-110 transition-transform text-zinc-600 group-hover:text-zinc-400" />
          <span className="text-[13px] font-semibold">Nova Meta Financeira</span>
        </button>
      </div>

      {/* Resumo das Metas - Exibição Flat com Grade de Números e Whitespace */}
      <div className="pt-8 border-t border-zinc-900/50">
        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Resumo Geral das Metas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-1">
            <p className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">{financialGoals.length}</p>
            <p className="text-[11px] text-zinc-500 font-medium">Metas definidas</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-emerald-400 font-mono tracking-tight">
              {financialGoals.filter(m => m.concluida).length}
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">Concluídas</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-zinc-100 font-mono tracking-tight">
              {fmt(financialGoals.reduce((s, m) => s + m.valor_atual, 0))}
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">Total acumulado</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-zinc-400 font-mono tracking-tight">
              {fmt(financialGoals.reduce((s, m) => s + (m.valor_alvo - m.valor_atual), 0))}
            </p>
            <p className="text-[11px] text-zinc-500 font-medium">Faltam economizar</p>
          </div>
        </div>
      </div>
    </div>
  );
}
