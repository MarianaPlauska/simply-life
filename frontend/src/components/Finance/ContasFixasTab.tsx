import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Receipt, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { toast } from 'sonner';

function getDaysUntilDue(diaVencimento: number): number {
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  let diff = diaVencimento - currentDay;
  if (diff < 0) diff += daysInMonth;
  return diff;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  aluguel: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/20',
    label: 'Aluguel & Moradia',
  },
  luz: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    label: 'Energia & Água',
  },
  internet: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    label: 'Internet & Telefone',
  },
  assinaturas: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/20',
    label: 'Assinaturas & SaaS',
  },
  outros: {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
    label: 'Outros',
  },
};

export function ContasFixasTab() {
  const contasFixas = useTaskStore((s) => s.contasFixas);
  const fetchContasFixas = useTaskStore((s) => s.fetchContasFixas);
  const addContaFixa = useTaskStore((s) => s.addContaFixa);
  const removeContaFixa = useTaskStore((s) => s.removeContaFixa);
  const toggleContaFixa = useTaskStore((s) => s.toggleContaFixa);
  const runFinanceCheck = useTaskStore((s) => s.runFinanceCheck);

  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    valor: '',
    dia_vencimento: '10',
    categoria: 'outros',
  });

  useEffect(() => {
    fetchContasFixas();
  }, [fetchContasFixas]);

  const handleAddConta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      toast.error('Informe o nome da conta');
      return;
    }
    const valorNum = parseFloat(form.valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      toast.error('Informe um valor válido maior que zero');
      return;
    }
    const diaNum = parseInt(form.dia_vencimento);
    if (isNaN(diaNum) || diaNum < 1 || diaNum > 31) {
      toast.error('O dia de vencimento deve ser entre 1 e 31');
      return;
    }

    await addContaFixa({
      nome: form.nome.trim(),
      valor: valorNum,
      dia_vencimento: diaNum,
      categoria: form.categoria,
      ativa: true,
    });

    setForm({
      nome: '',
      valor: '',
      dia_vencimento: '10',
      categoria: 'outros',
    });
    setShowAddForm(false);
    
    // Dispara a reavaliação de tarefas fantasma
    runFinanceCheck();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-900/40">
        <div>
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Contas Fixas & Assinaturas</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Contas recorrentes monitoradas ativamente que geram alertas automáticos de vencimento</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Configurar Recorrência
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddConta} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4 max-w-xl transition-all duration-300">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h3 className="text-[12px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
              <Receipt className="w-4 h-4 text-violet-400" />
              Adicionar Conta Fixa
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nome da Conta</label>
              <input
                type="text"
                placeholder="Ex: Aluguel, Netflix, Internet..."
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="150.00"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white font-mono placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Dia de Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="10"
                value={form.dia_vencimento}
                onChange={(e) => setForm({ ...form, dia_vencimento: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white font-mono outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Categoria</label>
              <select
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-300 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
              >
                <option value="aluguel">Aluguel & Moradia</option>
                <option value="luz">Energia & Água</option>
                <option value="internet">Internet & Telefone</option>
                <option value="assinaturas">Assinaturas & SaaS</option>
                <option value="outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2 bg-white text-zinc-950 rounded-lg text-[11px] font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-lg shadow-black/10"
            >
              Adicionar Recorrência
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-[11px] font-bold transition-all"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Lista de Contas Fixas */}
      <div className="bg-zinc-900/10 border border-zinc-800/40 rounded-xl overflow-hidden backdrop-blur-sm">
        {contasFixas.length === 0 ? (
          <div className="border border-dashed border-zinc-900/60 rounded-xl py-12 flex flex-col items-center justify-center text-center">
            <Receipt className="w-8 h-8 text-zinc-700 mb-2.5" />
            <p className="text-[12px] font-medium text-zinc-500">Nenhuma conta fixa cadastrada ainda.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 mt-1 uppercase tracking-wider"
            >
              Cadastrar Primeira Conta
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/60">
            {contasFixas.map((conta) => {
              const daysUntil = getDaysUntilDue(conta.dia_vencimento);
              const colorInfo = CATEGORY_COLORS[conta.categoria] || CATEGORY_COLORS.outros;
              const isClose = conta.ativa && daysUntil <= 3;
              const isToday = conta.ativa && daysUntil === 0;

              return (
                <div
                  key={conta.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 transition-all duration-300 ${
                    !conta.ativa ? 'opacity-40' : ''
                  } ${isClose ? 'bg-rose-500/5' : 'hover:bg-zinc-900/20'}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        isClose ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400'
                      }`}
                    >
                      <Receipt className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">{conta.nome}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${colorInfo.bg} ${colorInfo.text} ${colorInfo.border}`}
                        >
                          {colorInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 font-mono">
                          <DollarSign className="w-3 h-3 text-zinc-600" />
                          {conta.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-600" />
                          Dia {conta.dia_vencimento}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    {/* Alertas de Vencimento */}
                    {conta.ativa && (
                      <div className="flex items-center">
                        {isToday ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Vence hoje!
                          </span>
                        ) : isClose ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3 animate-pulse" />
                            Vence em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800/40 border border-zinc-700/20 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Próximo vencimento em {daysUntil} dias
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Ativa/Desativa Toggle */}
                      <button
                        onClick={() => {
                          toggleContaFixa(conta.id);
                          runFinanceCheck();
                        }}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded transition-colors ${
                          conta.ativa
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700/30 hover:bg-zinc-700 hover:text-white'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        }`}
                      >
                        {conta.ativa ? 'Pausar' : 'Ativar'}
                      </button>

                      {/* Botão de Excluir */}
                      <button
                        onClick={async () => {
                          if (confirm(`Excluir recorrência de "${conta.nome}"?`)) {
                            await removeContaFixa(conta.id);
                            runFinanceCheck();
                          }
                        }}
                        className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/5 rounded transition-all"
                        title="Remover recorrência"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
