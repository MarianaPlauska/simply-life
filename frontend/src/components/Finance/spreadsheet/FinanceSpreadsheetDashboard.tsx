import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { SpreadsheetIncomeBreakdown, SpreadsheetPeriodSummary } from '../../../lib/financeSpreadsheetAnalytics'
import { resolveSpreadsheetMood } from '../../../lib/financeSpreadsheetMood'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceSpreadsheetDashboardProps
{
  periodLabel: string
  summary: SpreadsheetPeriodSummary
  breakdown: SpreadsheetIncomeBreakdown
  onNewTransaction: () => void
}

export function FinanceSpreadsheetDashboard({
  periodLabel,
  summary,
  breakdown,
  onNewTransaction,
}: FinanceSpreadsheetDashboardProps)
{
  const moodState = useMemo(() => resolveSpreadsheetMood(summary), [summary])
  const restante = Math.max(0, summary.receitas - summary.despesas)
  const folgaPct = summary.receitas > 0
    ? Math.min(100, Math.round((restante / summary.receitas) * 100))
    : 0

  const donutData = [
    { name: 'Folga', value: folgaPct || 1, fill: 'var(--color-concluido, #22c55e)' },
    { name: 'Gasto', value: 100 - folgaPct || 0, fill: 'var(--color-line, #e5e5e5)' },
  ]

  const kpis = [
    {
      label: 'Saldo início',
      value: summary.saldoInicio,
      icon: Wallet,
      tone: 'text-ink',
      shell: 'bg-card border-line',
    },
    {
      label: 'Entradas',
      value: summary.receitas,
      icon: TrendingUp,
      tone: 'text-concluido',
      shell: 'bg-concluido/10 border-concluido/25',
    },
    {
      label: 'Saídas',
      value: summary.despesas,
      icon: TrendingDown,
      tone: 'text-urgente',
      shell: 'bg-urgente/10 border-urgente/25',
    },
    {
      label: 'Saldo final',
      value: summary.saldoFinal,
      icon: Wallet,
      tone: summary.saldoFinal >= 0 ? 'text-ink' : 'text-urgente',
      shell: 'bg-accent/8 border-accent/25',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${AXEL_TEXT_SECONDARY}`}>
            Painel · {periodLabel}
          </p>
          <p className={`text-sm mt-0.5 ${AXEL_TEXT_PRIMARY}`}>{moodState.detail}</p>
        </div>
        <button
          type="button"
          onClick={onNewTransaction}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sl bg-[#217346] hover:bg-[#1a5c38] text-white font-mono text-[10px] uppercase tracking-wide transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo lançamento
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kpis.map(({ label, value, icon: Icon, tone, shell }) => (
          <div key={label} className={`rounded-sl border px-3 py-3 ${shell}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={12} className={tone} />
              <p className={`font-mono text-[8px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
                {label}
              </p>
            </div>
            <p className={`text-lg sm:text-xl font-display tabular-nums ${tone}`}>
              {fmt(value)}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 rounded-sl border border-line bg-card p-4 min-h-[180px]">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Restante para gastar
          </p>
          <p className={`text-2xl font-display tabular-nums mt-1 ${restante >= 0 ? 'text-concluido' : 'text-urgente'}`}>
            {fmt(restante)}
          </p>
          <div className="h-[120px] mt-2 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius={36}
                  outerRadius={52}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className={`text-center font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
            {folgaPct}% de folga sobre entradas
          </p>
        </div>

        <div className="lg:col-span-7 rounded-sl border border-line bg-card p-4 space-y-3">
          <p className={`font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>Resumo de entradas</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-sl border border-line p-3 bg-chrome/30">
              <p className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>Fixas</p>
              <p className="text-base font-display tabular-nums text-concluido mt-1">{fmt(breakdown.receitasFixas)}</p>
            </div>
            <div className="rounded-sl border border-line p-3 bg-chrome/30">
              <p className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>Extras</p>
              <p className="text-base font-display tabular-nums text-accent mt-1">{fmt(breakdown.receitasExtras)}</p>
            </div>
            <div className="rounded-sl border border-concluido/30 p-3 bg-concluido/8">
              <p className={`font-mono text-[8px] uppercase ${AXEL_TEXT_SECONDARY}`}>Total</p>
              <p className="text-base font-display tabular-nums text-concluido mt-1">{fmt(breakdown.totalReceitas)}</p>
            </div>
          </div>
          <p className={`text-[11px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
            Para lançar hora extra, freelance ou bônus, use{' '}
            <strong className="text-ink">Novo lançamento → Receita</strong>
            {' '}e escolha o tipo de entrada.
          </p>
        </div>
      </div>
    </div>
  )
}
