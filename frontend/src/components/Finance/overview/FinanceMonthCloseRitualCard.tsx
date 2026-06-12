import { useMemo } from 'react'
import { CalendarCheck, Sparkles } from 'lucide-react'
import { useTaskStore } from '../../../store/useTaskStore'
import { buildMonthCloseRitual } from '../../../lib/financeMonthClose'
import {
  AXEL_BTN_PRIMARY,
  AXEL_BORDERLESS_PANEL,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface FinanceMonthCloseRitualCardProps
{
  onSetLimits?: () => void
}

export function FinanceMonthCloseRitualCard({ onSetLimits }: FinanceMonthCloseRitualCardProps)
{
  const transactions = useTaskStore((s) => s.transactions)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const recurringIncomes = useTaskStore((s) => s.recurringIncomes)
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const budgetLimits = useTaskStore((s) => s.budgetLimits)
  const categories = useTaskStore((s) => s.categories)
  const addXP = useTaskStore((s) => s.addXP)

  const ritual = useMemo(
    () => buildMonthCloseRitual({
      transactions,
      saldoInicial: cashAccount.saldo_inicial,
      reservedBills,
      recurringIncomes,
      contasFixas,
      budgetLimits,
      categories,
    }),
    [
      transactions,
      cashAccount.saldo_inicial,
      reservedBills,
      recurringIncomes,
      contasFixas,
      budgetLimits,
      categories,
    ],
  )

  if (!ritual.showRitual) return null

  const completeRitual = async () =>
  {
    await addXP('financeiro', 25)
  }

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} border-l-[3px] border-l-accent bg-gradient-to-br from-accent/10 to-transparent`}>
      <header className="flex items-center gap-2 mb-2">
        <CalendarCheck size={14} className="text-accent" />
        <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Ritual · fechamento {ritual.monthLabel}
        </p>
      </header>

      <div className="flex items-start gap-3">
        <Sparkles size={16} className="text-accent shrink-0 mt-0.5" />
        <div>
          <p className={`text-sm font-medium ${AXEL_TEXT_PRIMARY}`}>{ritual.headline}</p>
          <p className={`text-[11px] mt-1 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>{ritual.detail}</p>
        </div>
      </div>

      {ritual.deltaSaldo != null && (
        <p className={`font-mono text-[10px] mt-2 tabular-nums ${AXEL_TEXT_SECONDARY}`}>
          Previsto vs real: {ritual.deltaSaldo >= 0 ? '+' : ''}{fmt(ritual.deltaSaldo)}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mt-3">
        {onSetLimits && (
          <button
            type="button"
            onClick={onSetLimits}
            className={`flex-1 py-2.5 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
          >
            Ajustar limites
          </button>
        )}
        <button
          type="button"
          onClick={() => void completeRitual()}
          className="flex-1 py-2.5 font-mono text-[10px] uppercase rounded-sl border border-line text-ink-muted hover:text-ink"
        >
          Ritual feito · +25 XP
        </button>
      </div>
    </section>
  )
}
