import { ChevronDown } from 'lucide-react'
import { summarizeReservations } from '../../../lib/financeReservedBills'
import { CARD_BILL_SURFACES, CASH_BILL_SURFACE } from '../../../lib/financeBillCardStyle'
import type { BillFilterKey } from '../../../lib/financeBillVisual'
import {
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import type { ReservedBill } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const FILTERS: { key: BillFilterKey; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'urgentes', label: 'Urgentes' },
  { key: 'vencendo', label: 'Vencendo' },
  { key: 'parcelas', label: 'Parcelas' },
]

interface ReservedBillsSummaryBarProps
{
  bills: ReservedBill[]
  filter: BillFilterKey
  onFilterChange: (f: BillFilterKey) => void
  visibleCount: number
  compact?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
}

export function ReservedBillsSummaryBar({
  bills,
  filter,
  onFilterChange,
  visibleCount,
  compact = false,
  expanded = true,
  onToggleExpanded,
}: ReservedBillsSummaryBarProps)
{
  const summary = summarizeReservations(bills)

  if (compact && !expanded)
  {
    return (
      <button
        type="button"
        onClick={onToggleExpanded}
        className="w-full mb-3 flex items-center justify-between gap-2 rounded-sl border border-line bg-chrome/30 px-3 py-2.5 min-h-[44px] text-left hover:bg-chrome/50 transition-colors"
      >
        <div className="min-w-0">
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            {summary.countAbertas} reserva{summary.countAbertas === 1 ? '' : 's'} aberta{summary.countAbertas === 1 ? '' : 's'}
          </p>
          <p className={`text-sm font-mono tabular-nums truncate ${AXEL_TEXT_PRIMARY}`}>
            {fmt(summary.totalReservado)} reservado
            <span className={`text-[10px] mx-1.5 ${AXEL_TEXT_SECONDARY}`}>·</span>
            <span className={`text-[11px] ${AXEL_TEXT_SECONDARY}`}>
              {fmt(summary.totalGasto)} gasto
            </span>
          </p>
        </div>
        <ChevronDown size={16} className="shrink-0 text-ink-muted" aria-hidden />
      </button>
    )
  }

  return (
    <div className={`space-y-3 mb-4 ${compact ? 'rounded-sl border border-line bg-chrome/20 p-2.5 sm:p-3' : ''}`}>
      {compact && onToggleExpanded && (
        <button
          type="button"
          onClick={onToggleExpanded}
          className="w-full flex items-center justify-between gap-2 text-left min-h-[36px]"
        >
          <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>
            Detalhes das reservas
          </p>
          <ChevronDown size={16} className="shrink-0 text-ink-muted rotate-180" aria-hidden />
        </button>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Kpi label="Abertas" value={String(summary.countAbertas)} />
        <Kpi label="Reservado" value={fmt(summary.totalReservado)} />
        <Kpi label="Já gasto" value={fmt(summary.totalGasto)} />
        <Kpi label="Na lista" value={String(visibleCount)} muted />
      </div>

      {!compact && (
        <div className="hidden sm:flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>Cor</span>
          <span className={`inline-flex items-center gap-1.5 font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
            <span className={`w-2 h-2 rounded-full ${CASH_BILL_SURFACE.dot}`} />
            {CASH_BILL_SURFACE.label}
          </span>
          {Object.values(CARD_BILL_SURFACES).map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}
            >
              <span className={`w-2 h-2 rounded-full ${s.dot}`} />
              {s.label}
            </span>
          ))}
          <span className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY} opacity-60`}>
            · urgência só no badge / vencimento
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={filter === key ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
})
{
  return (
    <div className="rounded-sl border border-line bg-chrome/30 px-3 py-2">
      <p className={`font-mono text-[9px] uppercase ${AXEL_TEXT_SECONDARY}`}>{label}</p>
      <p className={`text-sm sm:text-base font-mono tabular-nums truncate ${
        muted ? AXEL_TEXT_SECONDARY : AXEL_TEXT_PRIMARY
      }`}>
        {value}
      </p>
    </div>
  )
}
