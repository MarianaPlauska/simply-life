import { useState } from 'react';
import { ArrowRight, ChevronDown, Trash2, Zap } from 'lucide-react';
import { PRIO_LABELS } from '../../constants/kanbanConfig';

interface BatchBarProps {
  count: number;
  onMove: (status: string) => void;
  onDelete: () => void;
  onPriority: (prio: string) => void;
  onClear: () => void;
}

const PRIORIDADES = ['critica', 'alta', 'media', 'baixa'] as const;

export function BatchBar({ count, onMove, onDelete, onPriority, onClear }: BatchBarProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showPrioMenu, setShowPrioMenu] = useState(false);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 
                    bg-zinc-950/90 border border-violet-500/20 rounded-full shadow-2xl shadow-violet-500/5 
                    backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <span className="text-[12px] font-semibold text-violet-300 px-1">
        {count} selecionada{count !== 1 ? 's' : ''}
      </span>
      <div className="h-4 w-px bg-zinc-800" />

      {/* mover tarefas */}
      <div className="relative">
        <button
          onClick={() => {
            setShowMoveMenu(!showMoveMenu);
            setShowPrioMenu(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium 
                     bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full 
                     hover:bg-zinc-850 hover:text-white transition-colors outline-none"
        >
          <ArrowRight className="w-3 h-3 text-zinc-400" />
          <span>Mover</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>
        {showMoveMenu && (
          <div className="absolute bottom-full left-0 mb-2 mt-0 z-50 w-36 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1">
            {['pendente', 'em_progresso', 'concluida'].map((s) => (
              <button
                key={s}
                onClick={() => {
                  onMove(s);
                  setShowMoveMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors capitalize"
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* prioridade em lote */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPrioMenu(!showPrioMenu);
            setShowMoveMenu(false);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium 
                     bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-full 
                     hover:bg-zinc-850 hover:text-white transition-colors outline-none"
        >
          <Zap className="w-3 h-3 text-zinc-400" />
          <span>Prioridade</span>
          <ChevronDown className="w-3 h-3 text-zinc-500" />
        </button>
        {showPrioMenu && (
          <div className="absolute bottom-full left-0 mb-2 mt-0 z-50 w-32 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl py-1">
            {PRIORIDADES.map((p) => (
              <button
                key={p}
                onClick={() => {
                  onPriority(p);
                  setShowPrioMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors capitalize"
              >
                {PRIO_LABELS[p] || p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-zinc-800" />

      {/* arquivar em lote */}
      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold 
                   text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all"
      >
        <Trash2 className="w-3 h-3" />
        <span>Arquivar</span>
      </button>

      <div className="h-4 w-px bg-zinc-800" />

      {/* cancelar seleção */}
      <button
        onClick={onClear}
        className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors px-1"
      >
        Limpar
      </button>
    </div>
  );
}
