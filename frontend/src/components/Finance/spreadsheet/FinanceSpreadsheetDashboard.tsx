import { useMemo } from 'react'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { SpreadsheetPeriodSummary } from '../../../lib/financeSpreadsheetAnalytics'
import { resolveSpreadsheetMood } from '../../../lib/financeSpreadsheetMood'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceSpreadsheetDashboardProps
{
  periodLabel: string
  summary: SpreadsheetPeriodSummary
}

export function FinanceSpreadsheetDashboard({
  periodLabel,
  summary,
}: FinanceSpreadsheetDashboardProps)
{
  const moodState = useMemo(() => resolveSpreadsheetMood(summary), [summary])
  const restante = summary.receitas - summary.despesas
  const folgaPct = summary.receitas > 0
    ? Math.min(100, Math.round((Math.max(0, restante) / summary.receitas) * 100))
    : 0

  const kpis = [
    {
      label: 'Saldo início',
      value: summary.saldoInicio,
      icon: Wallet,
      tone: 'text-ink',
    },
    {
      label: 'Entradas',
      value: summary.receitas,
      icon: TrendingUp,
      tone: 'text-concluido',
    },
    {
      label: 'Saídas',
      value: summary.despesas,
      icon: TrendingDown,
      tone: 'text-urgente',
    },
    {
      label: 'Saldo final',
      value: summary.saldoFinal,
      icon: Wallet,
      tone: summary.saldoFinal >= 0 ? 'text-concluido' : 'text-urgente',
    },
  ]

  return (
    <div className="space-y-3">
      <div>
        <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
          {periodLabel}
        </p>
        <p className={`text-[13px] mt-0.5 ${AXEL_TEXT_PRIMARY}`}>{moodState.detail}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-sl border border-line bg-card px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon size={12} className={tone} />
              <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
                {label}
              </p>
            </div>
            <p className={`text-lg font-display tabular-nums ${tone}`}>
              {fmt(value)}
            </p>
          </div>
        ))}
      </div>

      <p className={`text-[11px] leading-relaxed rounded-sl border border-line bg-chrome/30 px-3 py-2.5 ${AXEL_TEXT_SECONDARY}`}>
        Restante no período:{' '}
        <strong className={restante >= 0 ? 'text-concluido' : 'text-urgente'}>{fmt(restante)}</strong>
        {summary.receitas > 0 && (
          <span className="text-ink-muted">
            {' '}· {folgaPct}% de folga sobre entradas
          </span>
        )}
        . Receitas extras: capture pelo + → Gasto, ou Conta → Lançamento.
      </p>
    </div>
  )
}
