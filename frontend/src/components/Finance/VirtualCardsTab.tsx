import React, { useState, useMemo } from 'react';
import {
  CreditCard, Plus, Trash2, Eye, EyeOff, Lock, Unlock,
  TrendingUp, TrendingDown, Info, X, ShieldCheck
} from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import type { VirtualCard } from '../../store/storeTypes';
import { toast } from 'sonner';

// Formatação de moeda
function fmt(value: number)
{
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function VirtualCardsTab()
{
  const cards = useTaskStore((s) => s.cards);
  const transactions = useTaskStore((s) => s.transactions);
  const addCard = useTaskStore((s) => s.addCard);
  const removeCard = useTaskStore((s) => s.removeCard);
  const toggleCardStatus = useTaskStore((s) => s.toggleCardStatus);
  const updateCardLimit = useTaskStore((s) => s.updateCardLimit);

  // Estados locais para formulário e UI
  const [showAddForm, setShowAddForm] = useState(false);
  const [revealCVV, setRevealCVV] = useState<Record<string, boolean>>({});
  const [editingCardLimit, setEditingCardLimit] = useState<string | null>(null);
  const [newLimitVal, setNewLimitVal] = useState('');

  // Estados do formulário de criação
  const [form, setForm] = useState({
    nome: '',
    titular: 'MARIANA PLAUSKA',
    tipo_gradiente: 'purple' as VirtualCard['tipo_gradiente'],
    bandeira: 'visa' as 'visa' | 'mastercard',
    limite: '2000'
  });

  // Mapeamento de gradientes CSS premium
  const GRADIENTS = {
    purple: 'bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 border-white/[0.12]',
    obsidian: 'bg-gradient-to-br from-zinc-800 via-zinc-900 to-black border-zinc-800',
    sunset: 'bg-gradient-to-br from-rose-500 via-pink-600 to-amber-950 border-white/[0.12]',
    ocean: 'bg-gradient-to-br from-blue-600 via-cyan-800 to-slate-900 border-white/[0.12]',
    mint: 'bg-gradient-to-br from-emerald-600 via-teal-800 to-neutral-900 border-white/[0.12]'
  };

  // Cálculo de gastos acumulados por cartão
  const cardExpenses = useMemo(() =>
  {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.tipo === 'despesa' && t.card_id)
      .forEach((t) =>
      {
        map[t.card_id!] = (map[t.card_id!] || 0) + t.valor;
      });
    return map;
  }, [transactions]);

  // Projeção de fluxo de caixa para os próximos 6 meses
  const projectionData = useMemo(() =>
  {
    const data = [];
    const now = new Date();
    
    // Calcular médias dos últimos 3 meses para servir de base
    const pastIncomes = transactions.filter((t) => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const pastExpenses = transactions.filter((t) => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
    
    // Estimativas de receitas e despesas mensais baseadas no histórico ou padrões razoáveis
    const monthlyIncomeEstimate = pastIncomes > 0 ? pastIncomes : 7500;
    const monthlyExpenseEstimate = pastExpenses > 0 ? pastExpenses : 4200;

    let currentBalance = pastIncomes - pastExpenses;
    if (currentBalance <= 0)
    {
      currentBalance = 3500; // saldo inicial mínimo simulado caso o banco esteja limpo
    }

    const MONTH_NAMES = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    for (let i = 1; i <= 6; i++)
    {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const mName = MONTH_NAMES[targetDate.getMonth()];
      const year = targetDate.getFullYear();

      // Variações aleatórias muito sutis baseadas em sazonalidade
      const seasonalityFactor = 1 + Math.sin(i * 0.5) * 0.05;
      const projectedIncome = monthlyIncomeEstimate * seasonalityFactor;
      const projectedExpense = monthlyExpenseEstimate * (1 + (i * 0.02)); // inflação simulada de gastos

      currentBalance = currentBalance + projectedIncome - projectedExpense;

      data.push({
        mes: `${mName} ${year}`,
        receita: projectedIncome,
        despesa: projectedExpense,
        saldo: currentBalance
      });
    }

    return data;
  }, [transactions]);

  // Submissão do formulário de cartão
  const handleAddCard = (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!form.nome.trim())
    {
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
      tipo_gradiente: form.tipo_gradiente,
      bandeira: form.bandeira,
      status: 'ativo'
    });

    setForm({
      nome: '',
      titular: 'MARIANA PLAUSKA',
      tipo_gradiente: 'purple',
      bandeira: 'visa',
      limite: '2000'
    });
    setShowAddForm(false);
    toast.success('Novo cartão virtual gerado com sucesso!');
  };

  const handleToggleCVV = (id: string) =>
  {
    setRevealCVV((prev) =>
    {
      return {
        ...prev,
        [id]: !prev[id]
      };
    });
  };

  const handleSaveLimit = (id: string) =>
  {
    const limitNum = parseFloat(newLimitVal);
    if (!isNaN(limitNum) && limitNum >= 0)
    {
      updateCardLimit(id, limitNum);
      setEditingCardLimit(null);
      toast.success('Limite do cartão atualizado!');
    }
  };

  return (
    <div className="space-y-12">
      
      {/* SEÇÃO 1: CARTÕES VIRTUAIS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900/40">
          <div>
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Cartões Virtuais</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Cartões seguros e temporários para despesas isoladas</p>
          </div>
          <button
            onClick={() =>
            {
              setShowAddForm(!showAddForm);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Gerar Cartão
          </button>
        </div>

        {/* Formulário Inline / Alta Densidade */}
        {showAddForm && (
          <form onSubmit={handleAddCard} className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-5 space-y-4 max-w-xl transition-all duration-300">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h3 className="text-[12px] font-bold text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                Configurar Novo Cartão Virtual
              </h3>
              <button
                type="button"
                onClick={() =>
                {
                  setShowAddForm(false);
                }}
                className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Apelido do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Assinaturas AWS, Uber..."
                  value={form.nome}
                  onChange={(e) =>
                  {
                    setForm({ ...form, nome: e.target.value });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Limite do Cartão (R$)</label>
                <input
                  type="number"
                  placeholder="2000"
                  value={form.limite}
                  onChange={(e) =>
                  {
                    setForm({ ...form, limite: e.target.value });
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-white font-mono placeholder:text-zinc-700 outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Estilo Visual (Gradiente)</label>
                <div className="flex gap-2">
                  {(['purple', 'obsidian', 'sunset', 'ocean', 'mint'] as const).map((color) =>
                  {
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                        {
                          setForm({ ...form, tipo_gradiente: color });
                        }}
                        className={`w-6 h-6 rounded-full border ${form.tipo_gradiente === color ? 'border-white ring-2 ring-violet-500/30' : 'border-zinc-800'}`}
                        style={{
                          background: color === 'purple' ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' :
                                      color === 'obsidian' ? 'linear-gradient(135deg, #27272a, #09090b)' :
                                      color === 'sunset' ? 'linear-gradient(135deg, #f43f5e, #d97706)' :
                                      color === 'ocean' ? 'linear-gradient(135deg, #2563eb, #0891b2)' :
                                      'linear-gradient(135deg, #059669, #0d9488)'
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Bandeira</label>
                <div className="flex gap-2">
                  {(['visa', 'mastercard'] as const).map((b) =>
                  {
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() =>
                        {
                          setForm({ ...form, bandeira: b });
                        }}
                        className={`flex-1 py-1 px-3 border rounded-lg text-[10px] font-bold capitalize transition-colors ${form.bandeira === b ? 'bg-zinc-800 border-zinc-700 text-white' : 'border-zinc-900 text-zinc-500'}`}
                      >
                        {b}
                      </button>
                    );
                  })}
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
        )}

        {/* Grid de Cartões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((card) =>
          {
            const spent = cardExpenses[card.id] || 0;
            const limitPct = card.limite > 0 ? (spent / card.limite) * 100 : 0;
            const isBlocked = card.status === 'bloqueado';
            const isEditing = editingCardLimit === card.id;

            return (
              <div
                key={card.id}
                className="flex flex-col bg-zinc-950/20 border border-zinc-900 rounded-xl p-5 hover:border-zinc-800/80 transition-all duration-300 relative group"
              >
                
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
                          onClick={() =>
                          {
                            handleToggleCVV(card.id);
                          }}
                          className="flex items-center gap-1 text-[9px] font-mono font-semibold text-white hover:text-violet-200 transition-colors"
                        >
                          {revealCVV[card.id] ? card.cvv : '•••'}
                          {revealCVV[card.id] ? <EyeOff className="w-2.5 h-2.5 opacity-60" /> : <Eye className="w-2.5 h-2.5 opacity-60" />}
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
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={newLimitVal}
                              onChange={(e) =>
                              {
                                setNewLimitVal(e.target.value);
                              }}
                              className="w-16 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] text-white font-mono outline-none"
                              placeholder="Lim"
                            />
                            <button
                              onClick={() =>
                              {
                                handleSaveLimit(card.id);
                              }}
                              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() =>
                            {
                              setEditingCardLimit(card.id);
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
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex justify-between items-center pt-3 border-t border-zinc-900/60 mt-auto">
                    <button
                      onClick={() =>
                      {
                        toggleCardStatus(card.id);
                      }}
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
                      onClick={() =>
                      {
                        if (confirm('Deseja excluir permanentemente este cartão virtual?'))
                        {
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
          })}

          {cards.length === 0 && (
            <div className="col-span-full border border-dashed border-zinc-900/60 rounded-xl py-12 flex flex-col items-center justify-center text-center">
              <CreditCard className="w-8 h-8 text-zinc-700 mb-2.5" />
              <p className="text-[12px] font-medium text-zinc-500">Nenhum cartão virtual gerado ainda.</p>
              <button
                onClick={() =>
                {
                  setShowAddForm(true);
                }}
                className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 mt-1 uppercase tracking-wider"
              >
                Gerar Primeiro Cartão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 2: PROJEÇÃO DE FLUXO DE CAIXA (CASHFLOW FORECAST) */}
      <div className="space-y-6">
        <div className="pb-3 border-b border-zinc-900/40 flex items-center justify-between">
          <div>
            <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Previsão de Caixa (Fluxo de Caixa)</h2>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Projeções matemáticas estimadas para os próximos 6 meses</p>
          </div>
          <div className="flex items-center gap-1 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-900">
            <Info className="w-3 h-3 text-zinc-600" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Cálculo Base Sazonal</span>
          </div>
        </div>

        {/* Painel de Projeção de Caixa - Alta Densidade */}
        <div className="space-y-1">
          {/* Cabeçalho */}
          <div className="grid grid-cols-[1fr_120px_120px_140px] gap-4 py-2 border-b border-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <span>Período Previsto</span>
            <span className="text-right">Receitas Est.</span>
            <span className="text-right">Despesas Est.</span>
            <span className="text-right">Saldo Projetado</span>
          </div>

          {/* Linhas de Projeção */}
          <div className="divide-y divide-zinc-900/40">
            {projectionData.map((proj, idx) =>
            {
              const isBalancePositive = proj.saldo >= 0;
              return (
                <div
                  key={idx}
                  className="grid grid-cols-[1fr_120px_120px_140px] gap-4 items-center py-3.5 hover:bg-white/[0.01] hover:px-3 -mx-3 rounded-lg transition-all duration-200"
                >
                  <span className="text-[12px] font-semibold text-zinc-300">{proj.mes}</span>
                  <span className="text-[12px] text-emerald-400 font-mono font-medium text-right flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3 text-emerald-500/80" />
                    +{fmt(proj.receita)}
                  </span>
                  <span className="text-[12px] text-zinc-400 font-mono font-medium text-right flex items-center justify-end gap-1">
                    <TrendingDown className="w-3 h-3 text-zinc-600" />
                    -{fmt(proj.despesa)}
                  </span>
                  <span className={`text-[13px] font-bold font-mono text-right ${isBalancePositive ? 'text-violet-400' : 'text-rose-400'}`}>
                    {fmt(proj.saldo)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
