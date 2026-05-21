import { useState } from 'react';
import {
  Lock, Unlock, Eye, EyeOff, Trash2, AlertCircle
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import type { VirtualCard } from '../../store/storeTypes';
import { toast } from 'sonner';

interface VirtualCardItemProps {
  card: VirtualCard;
  spent: number;
}

// Formatação de moeda
function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Mapeamento de gradientes CSS premium
const GRADIENTS = {
  purple: 'bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 border-white/[0.12]',
  obsidian: 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-zinc-800',
  sunset: 'bg-gradient-to-br from-rose-500 via-pink-600 to-amber-950 border-white/[0.12]',
  ocean: 'bg-gradient-to-br from-blue-600 via-cyan-800 to-slate-900 border-white/[0.12]',
  mint: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-neutral-900 border-white/[0.12]'
};

export function VirtualCardItem({ card, spent }: VirtualCardItemProps) {
  const toggleCardStatus = useTaskStore((s) => s.toggleCardStatus);
  const removeCard = useTaskStore((s) => s.removeCard);
  const updateCardLimit = useTaskStore((s) => s.updateCardLimit);

  const [revealCVV, setRevealCVV] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [newLimitVal, setNewLimitVal] = useState(String(card.limite));

  const limitPct = card.limite > 0 ? (spent / card.limite) * 100 : 0;
  const isBlocked = card.status === 'bloqueado';

  const handleSaveLimit = () => {
    const limitNum = parseFloat(newLimitVal);
    if (!isNaN(limitNum) && limitNum >= 0) {
      updateCardLimit(card.id, limitNum);
      setIsEditingLimit(false);
      toast.success('Limite do cartão atualizado!');
    } else {
      toast.error('Informe um limite válido');
    }
  };

  return (
    <div className="flex flex-col bg-zinc-950/20 border border-zinc-900 rounded-xl p-5 hover:border-zinc-800/80 transition-all duration-300 relative group">
      
      {/* O Cartão Físico Simulado */}
      <div className={`aspect-[1.586/1] w-full max-w-[340px] mx-auto rounded-2xl p-5 flex flex-col justify-between border shadow-2xl relative overflow-hidden transition-all duration-500 ${GRADIENTS[card.tipo_gradiente]} ${isBlocked ? 'opacity-40 grayscale-[40%]' : ''}`}>
        {/* Detalhe de Brilho Sutil */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full blur-xl pointer-events-none" />

        {/* Topo do Cartão: Título, Rede e Status */}
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[12px] font-bold text-white tracking-wide truncate max-w-[180px]">{card.nome}</p>
            <p className="text-[8px] font-medium text-white/50 tracking-wider">CARTÃO VIRTUAL</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black tracking-widest text-white italic">
              {card.bandeira === 'visa' ? 'VISA' : 'Mastercard'}
            </span>
          </div>
        </div>

        {/* Meio: Chip & Código */}
        <div className="flex justify-between items-center relative z-10 py-1">
          {/* Chip */}
          <div className="w-8 h-6 rounded bg-gradient-to-r from-amber-200 to-yellow-300 border border-amber-300/40 relative overflow-hidden opacity-85">
            <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-0.5 opacity-30">
              <div className="border border-black/20" />
              <div className="border border-black/20" />
              <div className="border border-black/20" />
            </div>
          </div>
          {/* Status de Bloqueado */}
          {isBlocked && (
            <span className="flex items-center gap-1 bg-red-950/80 border border-red-500/20 text-[8px] font-bold text-red-400 px-2 py-0.5 rounded-full">
              <Lock className="w-2.5 h-2.5" />
              BLOQUEADO
            </span>
          )}
        </div>

        {/* Parte Inferior: Número do Cartão */}
        <div className="relative z-10">
          <p className="text-[15px] font-mono tracking-[0.2em] text-white text-center select-all">{card.numero}</p>
        </div>

        {/* Barra de Progresso do Limite (Glassmorphic) */}
        <div className="relative z-10 w-full space-y-0.5 my-0.5">
          <div className="flex justify-between text-[7px] text-white/50 font-bold tracking-wider uppercase">
            <span>Uso do Limite</span>
            <span>{limitPct.toFixed(0)}% ({fmt(spent)} / {fmt(card.limite)})</span>
          </div>
          <div className="h-0.5 w-full bg-white/10 backdrop-blur-md rounded-full overflow-hidden border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-700 ${limitPct > 90 ? 'bg-red-400' : limitPct > 70 ? 'bg-amber-400' : 'bg-white/85'}`}
              style={{ width: `${Math.min(limitPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Rodapé: Titular, Exp e CVV */}
        <div className="flex justify-between items-end relative z-10">
          <div>
            <p className="text-[7px] text-white/50 uppercase tracking-widest">Titular</p>
            <p className="text-[9px] font-mono font-bold text-white truncate max-w-[160px]">{card.titular}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-[7px] text-white/50 uppercase tracking-widest">Validade</p>
              <p className="text-[9px] font-mono font-semibold text-white">{card.validade}</p>
            </div>
            <div>
              <p className="text-[7px] text-white/50 uppercase tracking-widest">CVV</p>
              <button
                type="button"
                onClick={() => setRevealCVV(!revealCVV)}
                className="flex items-center gap-1 text-[9px] font-mono font-semibold text-white hover:text-violet-200 transition-colors"
              >
                {revealCVV ? card.cvv : '•••'}
                {revealCVV ? <EyeOff className="w-2.5 h-2.5 opacity-60" /> : <Eye className="w-2.5 h-2.5 opacity-60" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas e Detalhes do Cartão */}
      <div className="mt-5 space-y-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Barra de Limite */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
              <span>Consumo: <strong className="text-zinc-200 font-mono">{fmt(spent)}</strong></span>
              {isEditingLimit ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={newLimitVal}
                    onChange={(e) => setNewLimitVal(e.target.value)}
                    className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white font-mono outline-none"
                    placeholder="Lim"
                  />
                  <button
                    onClick={handleSaveLimit}
                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsEditingLimit(true);
                    setNewLimitVal(String(card.limite));
                  }}
                  className="hover:text-violet-400 transition-colors"
                >
                  Limite: <strong className="text-zinc-300 font-mono">{fmt(card.limite)}</strong>
                </button>
              )}
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${limitPct > 90 ? 'bg-red-500' : limitPct > 70 ? 'bg-amber-500' : 'bg-violet-500'}`}
                style={{ width: `${Math.min(limitPct, 100)}%` }}
              />
            </div>
            {limitPct >= 80 && (
              <div className={`flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold w-fit border ${
                limitPct >= 95 
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {limitPct >= 95 
                    ? `Alerta: Limite crítico (${limitPct.toFixed(0)}%)` 
                    : `Aviso: Uso próximo do limite (${limitPct.toFixed(0)}%)`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60 mt-auto">
          <button
            onClick={() => toggleCardStatus(card.id)}
            className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${isBlocked ? 'text-emerald-500 hover:text-emerald-400' : 'text-amber-500 hover:text-amber-400'}`}
          >
            {isBlocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Desbloquear
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                Bloquear
              </>
            )}
          </button>
          <button
            onClick={() => {
              if (confirm('Deseja excluir permanentemente este cartão virtual?')) {
                removeCard(card.id);
                toast.success('Cartão virtual removido');
              }
            }}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        </div>
      </div>

    </div>
  );
}
