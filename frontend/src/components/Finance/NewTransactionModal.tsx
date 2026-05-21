import { useState } from 'react';
import { 
  X, Plus, Wallet, CheckCircle2, AlertCircle, CalendarClock 
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { toast } from 'sonner';
import { FinanceCategories } from './FinanceCategories';

// Mapa de ícones para exibição dinâmica
import {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Shield, Target, Briefcase
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Home, Utensils, Car, Gamepad2, Wifi, Heart, GraduationCap, ShoppingCart, Zap, Wallet, Shield, Target, Briefcase
};

const STATUS_CONFIG = {
  pago: { label: 'Pago', icon: CheckCircle2, text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  pendente: { label: 'Pendente', icon: AlertCircle, text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  agendado: { label: 'Agendado', icon: CalendarClock, text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
} as const;

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewTransactionModal({ isOpen, onClose }: NewTransactionModalProps) {
  const cards = useTaskStore((s) => s.cards);
  const categories = useTaskStore((s) => s.categories);
  const addTransaction = useTaskStore((s) => s.addTransaction);
  const registerInteraction = useTaskStore((s) => s.registerInteraction);

  const [showCatModal, setShowCatModal] = useState(false);
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

  if (!isOpen) return null;

  const handleAdd = async () => {
    if (!form.descricao.trim() || !form.valor) return;

    if (form.tipo === 'despesa' && form.card_id) {
      const selectedCard = cards.find((c) => c.id === form.card_id);
      if (selectedCard && selectedCard.status === 'bloqueado') {
        toast.error('Não é possível registrar despesas em cartões virtuais bloqueados');
        return;
      }
    }

    await addTransaction({
      descricao: form.descricao.trim(),
      valor: parseFloat(form.valor),
      tipo: form.tipo,
      categoria: form.tipo === 'receita' ? '-' : form.categoria,
      categoria_id: form.categoria_id,
      data: form.data || new Date().toISOString().split('T')[0],
      status_pagamento: form.status_pagamento as 'pago' | 'pendente' | 'agendado',
      card_id: form.tipo === 'despesa' ? form.card_id : undefined,
    });

    setForm({ 
      descricao: '', 
      valor: '', 
      tipo: 'despesa', 
      categoria: '', 
      categoria_id: undefined, 
      data: '', 
      status_pagamento: 'pendente', 
      card_id: undefined 
    });
    onClose();
    registerInteraction('financeiro');
    toast.success(form.tipo === 'receita' ? 'Receita adicionada' : 'Despesa registrada');
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-zinc-950/95 border-l border-white/[0.04] shadow-2xl backdrop-blur-xl p-6 flex flex-col justify-between transform transition-all duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-6 overflow-y-auto pr-1 scrollbar-none flex-1 pb-6">
          <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
            <div>
              <h3 className="text-[14px] font-bold text-white tracking-wide uppercase">Novo Lançamento</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Insira despesas ou receitas no Simply-Life</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
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
                  {categories.filter(c => c.tipo === 'despesa').map((cat) => {
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
                  {cards.map((c) => (
                    <option key={c.id} value={c.id} className="bg-zinc-950 text-white">
                      {c.nome} ({c.numero.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Status de Pagamento</label>
                <div className="flex gap-2">
                  {(['pendente', 'pago', 'agendado'] as const).map((st) => {
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

        <div className="border-t border-white/[0.04] pt-4 mt-auto font-sans">
          <button
            onClick={handleAdd}
            disabled={!form.descricao.trim() || !form.valor}
            className="w-full py-2.5 rounded-xl bg-white text-zinc-950 text-[12px] font-bold hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
          >
            Salvar {form.tipo === 'receita' ? 'Receita' : 'Despesa'}
          </button>
        </div>
      </div>

      {showCatModal && <FinanceCategories onClose={() => setShowCatModal(false)} />}
    </>
  );
}
