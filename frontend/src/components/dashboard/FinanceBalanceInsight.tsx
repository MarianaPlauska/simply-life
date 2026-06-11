import { useMemo } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Sparkline } from '../ui/Sparkline'
import { MOCK_BALANCE_SPARKLINE_7D } from '../../data/mockDashboardData'

import { AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

// Saldo + tendência 7d — sparkline integrado ao resumo financeiro

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export function FinanceBalanceInsight()
{
  const { values, current, trendPct, trendUp } = useMemo(() =>
  {
    const vals = MOCK_BALANCE_SPARKLINE_7D.map((d) => d.saldo)
    const last = vals[vals.length - 1] ?? 0
    const first = vals[0] ?? last
    const pct = first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0

    return {
      values: vals,
      current: last,
      trendPct: pct,
      trendUp: pct >= 0,
    }
  }, [])

  const TrendIcon = trendUp ? TrendingUp : TrendingDown
  const trendClass = trendUp ? 'text-emerald-400/80' : 'text-rose-400/80'

  return (
    <div
      className="flex items-end justify-between gap-4 mb-4"
      aria-label={`Saldo atual ${fmtBRL(current)}, tendência ${trendPct.toFixed(1)} por cento em 7 dias`}
    >
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-500 tracking-tight mb-0.5">Saldo disponível</p>
        <p className={`text-[18px] font-semibold tabular-nums leading-none ${AXEL_TEXT_PRIMARY}`}>
          {fmtBRL(current)}
        </p>
        <p className={`mt-1.5 inline-flex items-center gap-1 text-[11px] tabular-nums ${trendClass}`}>
          <TrendIcon className="w-3 h-3 shrink-0" strokeWidth={2} />
          {trendUp ? '+' : ''}{trendPct.toFixed(1)}% · 7d
        </p>
      </div>

      <Sparkline
        data={values}
        width={96}
        height={28}
        gradientId="finance-balance-spark"
        className="shrink-0 opacity-90"
      />
    </div>
  )
}
