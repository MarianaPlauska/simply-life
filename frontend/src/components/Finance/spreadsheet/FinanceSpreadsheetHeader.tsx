import { Plus } from 'lucide-react'
import type { SpreadsheetPeriodSummary } from '../../../lib/financeSpreadsheetAnalytics'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceSpreadsheetHeaderProps
{
  periodLabel: string
  summary: SpreadsheetPeriodSummary
  onNewTransaction: () => void
}

export function FinanceSpreadsheetHeader({
  periodLabel,
  summary,
  onNewTransaction,
}: FinanceSpreadsheetHeaderProps)
{
  const boxes = [
    { label: 'Saldo início', labelMd: 'Saldo início do período', value: summary.saldoInicio, tone: 'text-ink' },
    { label: 'Saldo final', labelMd: 'Saldo final do período', value: summary.saldoFinal, tone: 'text-ink' },
    { label: 'Receitas', labelMd: 'Receitas', value: summary.receitas, tone: 'text-concluido', bg: 'bg-concluido/12 border-concluido/30' },
    { label: 'Despesas', labelMd: 'Despesas', value: summary.despesas, tone: 'text-urgente', bg: 'bg-urgente/12 border-urgente/30' },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:items-stretch">
      <button
        type="button"
        onClick={onNewTransaction}
        className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sl bg-concluido hover:bg-concluido/90 text-white font-mono text-[11px] uppercase tracking-wide transition-colors"
      >
        <Plus className="w-4 h-4" />
        Novo lançamento
      </button>

      <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {boxes.map((box) => (
          <div
            key={box.label}
            className={`rounded-sl border border-line bg-card px-3 py-2.5 ${box.bg ?? ''}`}
          >
            <p className="font-mono text-[9px] uppercase tracking-wide text-ink-muted leading-tight">
              <span className="sm:hidden">{box.label}</span>
              <span className="hidden sm:inline">{box.labelMd}</span>
            </p>
            <p className={`text-base sm:text-xl font-display tabular-nums mt-1 break-all sm:break-normal ${box.tone}`}>
              {fmt(box.value)}
            </p>
          </div>
        ))}
      </div>

      <p className="lg:hidden font-mono text-[10px] uppercase text-ink-muted text-center">
        {periodLabel}
      </p>
    </div>
  )
}
