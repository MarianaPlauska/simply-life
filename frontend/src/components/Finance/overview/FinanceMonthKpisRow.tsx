import { maskFinanceValue } from '../../../lib/financeHideValues'
import type { BalanceTone } from '../../../lib/financeBalanceTone'
import {
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
  AXEL_METRIC_HAIRLINE,
  MODULE_HERO,
  MODULE_METRIC,
  MODULE_WASH,
} from '../../../constants/axelSurfaces'
import { FinanceStabilityMeter } from '../FinanceStabilityMeter'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthKpisRowProps
{
  saldoDisponivel: number
  receita: number
  despesas: number
  saldoMes?: number
  stabilityTone?: BalanceTone
  compact?: boolean
  hideValues?: boolean
  projectionLabels?: boolean
  onConfigureSaldo?: () => void
  onReconcile?: () => void
}

export function FinanceMonthKpisRow({
  saldoDisponivel,
  receita,
  despesas,
  saldoMes,
  stabilityTone,
  compact = false,
  hideValues = false,
  projectionLabels = false,
  onConfigureSaldo,
  onReconcile,
}: FinanceMonthKpisRowProps)
{
  const rest = [
    {
      label: projectionLabels ? 'Entradas previstas' : 'Entrou',
      value: receita,
    },
    {
      label: projectionLabels ? 'Compromissos' : 'Saiu',
      value: despesas,
    },
    ...(saldoMes !== undefined
      ? [{
          label: projectionLabels ? 'Sobra estimada' : 'Saldo do mês',
          value: saldoMes,
        }]
      : []),
  ]

  const heroLabel = projectionLabels ? 'Saldo inicial' : 'Disponível'

  return (
    <div className="space-y-2">
      {onReconcile && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onReconcile}
            className="text-[12px] px-2.5 py-1.5 rounded-sl border border-line text-ink-muted hover:text-ink hover:border-line transition-colors min-h-[44px]"
          >
            Recalcular duplicatas
          </button>
        </div>
      )}
      {saldoDisponivel <= 0 && !projectionLabels && onConfigureSaldo && (
        <button
          type="button"
          onClick={onConfigureSaldo}
          className="w-full text-left rounded-sl border border-finance/35 bg-finance-muted px-3 py-2.5 min-h-[44px] hover:opacity-90 transition-colors"
        >
          <p className="text-[13px] font-medium text-ink">
            Informe o saldo livre da conta
          </p>
          <p className={`text-[12px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Contas → Conta. Sem isso o disponível não é real.
          </p>
        </button>
      )}

      <div className={AXEL_METRIC_HAIRLINE}>
        {onConfigureSaldo && !projectionLabels ? (
          <button
            type="button"
            onClick={onConfigureSaldo}
            className="w-full text-left rounded-sl hover:bg-chrome/50 -mx-1 px-1 py-1 min-h-11"
          >
            <p className="sl-eyebrow text-finance">{heroLabel}</p>
            <div className={`inline-block mt-1 ${MODULE_WASH.finance}`}>
              <p className={`${compact ? 'text-[1.65rem]' : MODULE_HERO.finance} ${hideValues ? 'text-ink-muted' : ''}`}>
                {maskFinanceValue(hideValues, fmt(saldoDisponivel))}
              </p>
            </div>
            <p className={`text-[11px] mt-1 ${AXEL_TEXT_SECONDARY}`}>
              Toque para ajustar o valor na conta
            </p>
          </button>
        ) : (
          <>
            <p className="sl-eyebrow text-finance">{heroLabel}</p>
            <div className={`inline-block mt-1 ${MODULE_WASH.finance}`}>
              <p className={`${compact ? 'text-[1.65rem]' : MODULE_HERO.finance} ${hideValues ? 'text-ink-muted' : ''}`}>
                {maskFinanceValue(hideValues, fmt(saldoDisponivel))}
              </p>
            </div>
          </>
        )}
        {stabilityTone && !hideValues && (
          <FinanceStabilityMeter tone={stabilityTone} className="mt-2" />
        )}
      </div>

      <div className={`grid gap-3 ${rest.length === 3 ? 'grid-cols-3' : 'grid-cols-2'} ${AXEL_METRIC_HAIRLINE} mt-2`}>
        {rest.map(({ label, value }) =>
        {
          const negative = label === 'Saldo do mês' && value < 0
          return (
          <div key={label}>
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{label}</p>
            <p className={`mt-0.5 ${hideValues ? 'text-ink-muted text-[13px] sm:text-sm font-sans tabular-nums' : negative ? 'text-[13px] sm:text-sm font-sans tabular-nums text-urgente' : MODULE_METRIC.finance}`}>
              {maskFinanceValue(hideValues, fmt(value))}
            </p>
          </div>
          )
        })}
      </div>
    </div>
  )
}
