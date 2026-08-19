import { maskFinanceValue } from '../../../lib/financeHideValues'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthKpisRowProps
{
  saldoDisponivel: number
  receita: number
  despesas: number
  saldoMes?: number
  balanceToneClass?: string
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
  balanceToneClass = 'text-finance',
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
            className="text-[12px] px-2.5 py-1.5 rounded-sl border border-line text-ink-muted hover:text-urgente hover:border-urgente/40 transition-colors min-h-[36px]"
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

      <div className="rounded-sl bg-card px-3 py-3">
        <p className="sl-eyebrow text-finance">{heroLabel}</p>
        <p className={`${compact ? 'text-[1.65rem]' : 'sl-metric'} font-sans font-medium tabular-nums tracking-tight mt-1 ${hideValues ? 'text-ink-muted' : balanceToneClass}`}>
          {maskFinanceValue(hideValues, fmt(saldoDisponivel))}
        </p>
      </div>

      <div className={`grid gap-2 ${rest.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {rest.map(({ label, value }) => (
          <div key={label} className="rounded-sl bg-card px-2.5 py-2">
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{label}</p>
            <p className={`text-[13px] sm:text-sm font-sans tabular-nums mt-0.5 ${hideValues ? 'text-ink-muted' : 'text-ink'}`}>
              {maskFinanceValue(hideValues, fmt(value))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
