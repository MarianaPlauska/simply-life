import { useState } from 'react';
import { X } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { toast } from 'sonner';

interface NewGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewGoalModal({ isOpen, onClose }: NewGoalModalProps) {
  const addGoal = useTaskStore((s) => s.addGoal);
  const [goalForm, setGoalForm] = useState({ titulo: '', valor_alvo: '', icone: 'Target', cor: '#8b5cf6' });

  if (!isOpen) return null;

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
    onClose();
    toast.success('Meta criada!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-4 font-sans" onClick={onClose}>
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/50 rounded-2xl p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-white">Nova Meta</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Título da Meta</label>
          <input 
            type="text" 
            placeholder="Ex: Viagem Japão, Novo Macbook..." 
            value={goalForm.titulo} 
            onChange={(e) => setGoalForm({ ...goalForm, titulo: e.target.value })} 
            className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-650 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition" 
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Valor Alvo (R$)</label>
          <input 
            type="number" 
            placeholder="0,00" 
            value={goalForm.valor_alvo} 
            onChange={(e) => setGoalForm({ ...goalForm, valor_alvo: e.target.value })} 
            className="w-full bg-zinc-800/40 border border-zinc-700/40 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder:text-zinc-650 outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/40 transition font-mono" 
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-500 mb-1.5">Cor</label>
          <div className="flex flex-wrap gap-2">
            {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'].map(c => (
              <button 
                key={c} 
                onClick={() => setGoalForm({ ...goalForm, cor: c })} 
                className={`w-6 h-6 rounded-full border-2 ${goalForm.cor === c ? 'border-white' : 'border-transparent'}`} 
                style={{ backgroundColor: c }} 
              />
            ))}
          </div>
        </div>
        <button 
          onClick={handleAddGoal} 
          disabled={!goalForm.titulo.trim() || !goalForm.valor_alvo} 
          className="w-full py-2.5 rounded-xl bg-white text-zinc-900 text-[13px] font-semibold hover:bg-zinc-200 transition-colors disabled:opacity-40"
        >
          Criar Meta
        </button>
      </div>
    </div>
  );
}
