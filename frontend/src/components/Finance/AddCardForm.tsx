import { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import type { VirtualCard } from '../../store/storeTypes';
import { toast } from 'sonner';

interface AddCardFormProps {
  onClose: () => void;
}

export function AddCardForm({ onClose }: AddCardFormProps) {
  const addCard = useTaskStore((s) => s.addCard);

  const [form, setForm] = useState({
    nome: '',
    titular: 'MARIANA PLAUSKA',
    tipo_gradiente: 'purple' as VirtualCard['tipo_gradiente'],
    bandeira: 'visa' as 'visa' | 'mastercard',
    limite: '2000',
    dia_vencimento: '10'
  });

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Informe um nome para o cartão');
      return;
    }

    const lastDigits = Math.floor(1000 + Math.random() * 9000);
    const mockNumber = `•••• •••• •••• ${lastDigits}`;
    const expiryMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const expiryYear = String(new Date().getFullYear() + 4).slice(-2);
    const mockExpiry = `${expiryMonth}/${expiryYear}`;
    const mockCVV = String(Math.floor(100 + Math.random() * 900));

    addCard({
      nome: form.nome.trim(),
      titular: form.titular.toUpperCase(),
      numero: mockNumber,
      validade: mockExpiry,
      cvv: mockCVV,
      limite: parseFloat(form.limite) || 2000,
      dia_vencimento: parseInt(form.dia_vencimento) || 10,
      tipo_gradiente: form.tipo_gradiente,
      bandeira: form.bandeira,
      status: 'ativo'
    });

    setForm({
      nome: '',
      titular: 'MARIANA PLAUSKA',
      tipo_gradiente: 'purple',
      bandeira: 'visa',
      limite: '2000',
      dia_vencimento: '10'
    });
    onClose();
    toast.success('Novo cartão virtual gerado com sucesso!');
  };

  return (
    <form onSubmit={handleAddCard} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4 max-w-xl transition-all duration-300">
      <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
        <h3 className="text-[12px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          Configurar Novo Cartão Virtual
        </h3>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Apelido do Cartão</label>
          <input
            type="text"
            placeholder="Ex: Assinaturas AWS, Uber..."
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Limite (R$)</label>
          <input
            type="number"
            placeholder="2000"
            value={form.limite}
            onChange={(e) => setForm({ ...form, limite: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white font-mono placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Dia Vencimento</label>
          <input
            type="number"
            min="1"
            max="31"
            placeholder="10"
            value={form.dia_vencimento}
            onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white font-mono placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Estilo Visual (Gradiente)</label>
          <div className="flex gap-2">
            {(['purple', 'obsidian', 'sunset', 'ocean', 'mint'] as const).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, tipo_gradiente: color })}
                className={`w-6 h-6 rounded-full border ${form.tipo_gradiente === color ? 'border-white ring-2 ring-violet-500/30' : 'border-zinc-800'}`}
                style={{
                  background: color === 'purple' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' :
                              color === 'obsidian' ? 'linear-gradient(135deg, #27272a, #09090b)' :
                              color === 'sunset' ? 'linear-gradient(135deg, #f43f5e, #d97706)' :
                              color === 'ocean' ? 'linear-gradient(135deg, #2563eb, #0891b2)' :
                              'linear-gradient(135deg, #059669, #0d9488)'
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Bandeira</label>
          <div className="flex gap-2">
            {(['visa', 'mastercard'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setForm({ ...form, bandeira: b })}
                className={`flex-1 py-1 px-3 border rounded-lg text-[10px] font-bold capitalize transition-colors ${form.bandeira === b ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-zinc-900 text-zinc-500'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2 bg-white text-zinc-950 rounded-lg text-[11px] font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-black/10"
      >
        Confirmar e Gerar Cartão
      </button>
    </form>
  );
}
