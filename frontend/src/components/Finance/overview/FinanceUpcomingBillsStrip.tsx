import { useMemo } from 'react'
import { CalendarClock } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { getUpcomingBills } from '../../../lib/financeBillOrchestrator'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY, AXEL_METRIC_HAIRLINE } from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceUpcomingBillsStripProps
{
  days?: number
  onOpenBills?: () => void
}

// Linha do tempo de contas - fluxo de caixa previsto (Organizze/Mobills)

export function FinanceUpcomingBillsStrip({
  days = 14,
  onOpenBills,
}: FinanceUpcomingBillsStripProps)
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)

  const bills = useMemo(
    () => getUpcomingBills({ contasFixas, reservedBills, cards, transactions, windowDays: days }),
    [contasFixas, reservedBills, cards, transactions, days],
  )

  if (bills.length === 0) return null

  const total = bills.reduce((s, b) => s + b.valor, 0)

  return (
    <section className={`${AXEL_METRIC_HAIRLINE} space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <CalendarClock size={13} className="text-accent" />
          <p className={`font-mono text-[9px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Próximos {days} dias
          </p>
        </div>
        <span className={`font-mono text-[10px] tabular-nums text-urgente`}>
          {fmt(total)}
        </span>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
        {bills.slice(0, 8).map((b) => (
          <div
            key={b.id}
            className={`shrink-0 rounded-sl border px-2 py-1.5 min-w-[100px] ${
              b.urgente ? 'border-atencao/40 bg-atencao/8' : 'border-line bg-chrome/30'
            }`}
          >
            <p className={`text-[10px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{b.nome}</p>
            <p className={`font-mono text-[9px] tabular-nums ${AXEL_TEXT_SECONDARY}`}>
              {fmt(b.valor)} · {b.diasRestantes === 0 ? 'hoje' : `${b.diasRestantes}d`}
            </p>
          </div>
        ))}
      </div>
      {onOpenBills && (
        <button
          type="button"
          onClick={onOpenBills}
          className="font-mono text-[8px] uppercase text-accent hover:underline"
        >
          Ver faturas e fixas
        </button>
      )}
    </section>
  )
}
