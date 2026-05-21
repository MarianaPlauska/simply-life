import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Info } from 'lucide-react';
import type { Transaction } from '../../store/useTaskStore';

interface CashflowForecastProps
{
  transactions: Transaction[];
}

function fmt(value: number)
{
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CashflowForecast({ transactions }: CashflowForecastProps)
{
  // Projeção de fluxo de caixa para os próximos 6 meses
  const projectionData = useMemo(() =>
  {
    const data = [];
    const now = new Date();

    const uniqueMonths = new Set<string>();
    transactions.forEach((t) =>
    {
      if (t.data)
      {
        const monthKey = t.data.substring(0, 7); // extrai YYYY-MM
        uniqueMonths.add(monthKey);
      }
    });

    const monthCount = uniqueMonths.size;
    const totalIncome = transactions.filter((t) => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
    const totalExpense = transactions.filter((t) => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);

    let monthlyIncomeEstimate = 7500;
    let monthlyExpenseEstimate = 4200;

    if (monthCount >= 2)
    {
      monthlyIncomeEstimate = totalIncome / monthCount;
      monthlyExpenseEstimate = totalExpense / monthCount;
    }
    else if (monthCount === 1)
    {
      monthlyIncomeEstimate = totalIncome > 0 ? totalIncome : 7500;
      monthlyExpenseEstimate = totalExpense > 0 ? totalExpense : 4200;
    }

    let currentBalance = totalIncome - totalExpense;
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

  return (
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
  );
}
