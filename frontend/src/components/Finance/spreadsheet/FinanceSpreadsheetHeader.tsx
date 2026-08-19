import type { SpreadsheetPeriodSummary } from '../../../lib/financeSpreadsheetAnalytics'
import { AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceSpreadsheetHeaderProps
{
  periodLabel: string
  summary: SpreadsheetPeriodSummary
}

export function FinanceSpreadsheetHeader({
  periodLabel,
  summary,
}: FinanceSpreadsheetHeaderProps)
{
  const boxes = [
    { label: 'Início', value: summary.saldoInicio },
    { label: 'Final', value: summary.saldoFinal },
    { label: 'Receitas', value: summary.receitas },
    { label: 'Despesas', value: summary.despesas },
  ]

  return (
    <div className="space-y-2">
      <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>{periodLabel}</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {boxes.map((box) => (
          <div key={box.label} className="rounded-sl bg-card px-3 py-2.5">
            <p className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>{box.label}</p>
            <p className="text-sm sm:text-base font-sans tabular-nums mt-0.5 text-ink">
              {fmt(box.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
