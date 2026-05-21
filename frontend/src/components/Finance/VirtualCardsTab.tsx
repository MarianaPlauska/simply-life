import { useState, useMemo } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { useTaskStore } from '../../store/useTaskStore';
import { AddCardForm } from './AddCardForm';
import { VirtualCardItem } from './VirtualCardItem';
import { CashflowForecast } from './CashflowForecast';

export function VirtualCardsTab() {
  const cards = useTaskStore((s) => s.cards);
  const transactions = useTaskStore((s) => s.transactions);

  // Estados locais para formulário e UI
  const [showAddForm, setShowAddForm] = useState(false);

  // Cálculo de gastos acumulados por cartão
  const cardExpenses = useMemo(() => {
    const map: Record<string, number> = {};
    transactions
      .filter((t) => t.tipo === 'despesa' && t.card_id)
      .forEach((t) => {
        map[t.card_id!] = (map[t.card_id!] || 0) + t.valor;
      });
    return map;
  }, [transactions]);

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
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            Gerar Cartão
          </button>
        </div>

        {/* Formulário Inline / Alta Densidade */}
        {showAddForm && (
          <AddCardForm onClose={() => setShowAddForm(false)} />
        )}

        {/* Grid de Cartões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cards.map((card) => (
            <VirtualCardItem
              key={card.id}
              card={card}
              spent={cardExpenses[card.id] || 0}
            />
          ))}

          {cards.length === 0 && (
            <div className="col-span-full border border-dashed border-zinc-900/60 rounded-xl py-12 flex flex-col items-center justify-center text-center">
              <CreditCard className="w-8 h-8 text-zinc-700 mb-2.5" />
              <p className="text-[12px] font-medium text-zinc-500">Nenhum cartão virtual gerado ainda.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="text-[11px] font-semibold text-violet-400 hover:text-violet-300 mt-1 uppercase tracking-wider"
              >
                Gerar Primeiro Cartão
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SEÇÃO 2: PROJEÇÃO DE FLUXO DE CAIXA (CASHFLOW FORECAST) */}
      <CashflowForecast transactions={transactions} />

    </div>
  );
}
