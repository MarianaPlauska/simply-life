import { useMemo } from 'react';
import type { Category, Transaction } from '../../store/storeTypes';
import { computeRule503020 } from '../../utils/rule503020';

function fmt(value: number)
{
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  activeCategories,
}: Rule503020SectionProps)
{
  const rule = useMemo(
    () => computeRule503020({ receita, despesas, monthTx, activeCategories }),
    [receita, despesas, monthTx, activeCategories],
  );

  const {
    realNecessidades,
    realDesejos,
    realPoupanca,
    pctNecessidades,
    pctDesejos,
    pctPoupanca,
    isCompliant,
  } = rule;

  return (
    <div className="space-y-4 py-6 border-t border-zinc-900/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Distribuição 50-30-20 (Sua Meta vs Real)</h2>
          <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Análise de conformidade com a regra de ouro das finanças pessoais</p>
        </div>
        {receita > 0 && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              isCompliant
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isCompliant ? 'Dentro da regra' : 'Ajustar gastos'}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
