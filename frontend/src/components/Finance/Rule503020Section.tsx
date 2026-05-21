import { useMemo } from 'react';
import type { Category, Transaction } from '../../store/storeTypes';

// Formatação de valores monetários
function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Helper para classificar categorias na regra 50-30-20
function getCategoryBudgetGroup(categoryName: string): 'necessidades' | 'desejos' | 'poupanca' {
  const name = categoryName.toLowerCase();
  if (
    name.includes('moradia') ||
    name.includes('habita') ||
    name.includes('casa') ||
    name.includes('saude') ||
    name.includes('educa') ||
    name.includes('internet') ||
    name.includes('alimenta') ||
    name.includes('mercado') ||
    name.includes('energia') ||
    name.includes('transporte') ||
    name.includes('luz') ||
    name.includes('agua') ||
    name.includes('contas')
  ) {
    return 'necessidades';
  }

  if (
    name.includes('poupan') ||
    name.includes('invest') ||
    name.includes('reserva') ||
    name.includes('poupar') ||
    name.includes('acoes') ||
    name.includes('fundos')
  ) {
    return 'poupanca';
  }

  return 'desejos';
}

interface Rule503020SectionProps {
  receita: number;
  despesas: number;
  monthTx: Transaction[];
  activeCategories: Category[];
}

export function Rule503020Section({
  receita,
  despesas,
  monthTx,
  activeCategories
}: Rule503020SectionProps) {
  // Cálculo matemático para a regra 50-30-20
  const realNecessidades = useMemo(() => {
    return monthTx
      .filter((t) => t.tipo === 'despesa')
      .filter((t) => {
        const cat = activeCategories.find((c) => c.id === t.categoria_id);
        const catName = cat ? cat.nome : (t.categoria || '');
        return getCategoryBudgetGroup(catName) === 'necessidades';
      })
      .reduce((sum, t) => sum + t.valor, 0);
  }, [monthTx, activeCategories]);

  const realDesejos = useMemo(() => {
    return monthTx
      .filter((t) => t.tipo === 'despesa')
      .filter((t) => {
        const cat = activeCategories.find((c) => c.id === t.categoria_id);
        const catName = cat ? cat.nome : (t.categoria || '');
        return getCategoryBudgetGroup(catName) === 'desejos';
      })
      .reduce((sum, t) => sum + t.valor, 0);
  }, [monthTx, activeCategories]);

  const realPoupancaExplicito = useMemo(() => {
    return monthTx
      .filter((t) => t.tipo === 'despesa')
      .filter((t) => {
        const cat = activeCategories.find((c) => c.id === t.categoria_id);
        const catName = cat ? cat.nome : (t.categoria || '');
        return getCategoryBudgetGroup(catName) === 'poupanca';
      })
      .reduce((sum, t) => sum + t.valor, 0);
  }, [monthTx, activeCategories]);

  const realPoupanca = useMemo(() => {
    const leftOver = receita - despesas;
    return realPoupancaExplicito + (leftOver > 0 ? leftOver : 0);
  }, [receita, despesas, realPoupancaExplicito]);

  const pctNecessidades = useMemo(() => {
    const pctDenom = receita > 0 ? receita : (despesas > 0 ? despesas : 1);
    return (realNecessidades / pctDenom) * 100;
  }, [realNecessidades, receita, despesas]);

  const pctDesejos = useMemo(() => {
    const pctDenom = receita > 0 ? receita : (despesas > 0 ? despesas : 1);
    return (realDesejos / pctDenom) * 100;
  }, [realDesejos, receita, despesas]);

  const pctPoupanca = useMemo(() => {
    const pctDenom = receita > 0 ? receita : (despesas > 0 ? despesas : 1);
    return (realPoupanca / pctDenom) * 100;
  }, [realPoupanca, receita, despesas]);

  return (
    <div className="space-y-4 py-6 border-t border-zinc-900/50">
      <div>
        <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Distribuição 50-30-20 (Sua Meta vs Real)</h2>
        <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Análise de conformidade com a regra de ouro das finanças pessoais</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Necessidades */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-zinc-300">Necessidades (Meta: 50%)</span>
            <span className="font-mono text-zinc-400 font-bold">{pctNecessidades.toFixed(1)}% <span className="text-[9px] text-zinc-500">({fmt(realNecessidades)})</span></span>
          </div>
          <div className="relative h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[50%] bg-white/5 border-r border-white/20" />
            <div
              className={`h-full rounded-full transition-all duration-700 ${pctNecessidades > 55 ? 'bg-amber-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.min(pctNecessidades, 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-zinc-500">Moradia, Saúde, Educação, Alimentação e Contas Essenciais.</p>
        </div>

        {/* Desejos */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-zinc-300">Desejos (Meta: 30%)</span>
            <span className="font-mono text-zinc-400 font-bold">{pctDesejos.toFixed(1)}% <span className="text-[9px] text-zinc-500">({fmt(realDesejos)})</span></span>
          </div>
          <div className="relative h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[30%] bg-white/5 border-r border-white/20" />
            <div
              className={`h-full rounded-full transition-all duration-700 ${pctDesejos > 35 ? 'bg-amber-500' : 'bg-violet-500'}`}
              style={{ width: `${Math.min(pctDesejos, 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-zinc-500">Lazer, Compras, Viagens, Restaurantes e Estilo de Vida.</p>
        </div>

        {/* Poupança / Reservas */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold text-zinc-300">Poupança & Reservas (Meta: 20%)</span>
            <span className="font-mono text-zinc-400 font-bold">{pctPoupanca.toFixed(1)}% <span className="text-[9px] text-zinc-500">({fmt(realPoupanca)})</span></span>
          </div>
          <div className="relative h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full w-[20%] bg-white/5 border-r border-white/20" />
            <div
              className={`h-full rounded-full transition-all duration-700 ${pctPoupanca >= 20 ? 'bg-emerald-500' : 'bg-violet-400'}`}
              style={{ width: `${Math.min(pctPoupanca, 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-zinc-500">Investimentos, Metas de Longo Prazo e Saldo Livre Restante.</p>
        </div>
      </div>
    </div>
  );
}
