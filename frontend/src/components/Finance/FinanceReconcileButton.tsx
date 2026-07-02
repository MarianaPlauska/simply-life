import { Loader2 } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { countLedgerDuplicates } from '../../lib/financeTransactionDedup'

interface FinanceReconcileButtonProps
{
  label?: string
  className?: string
}

/** Dispara limpeza de duplicatas, reservas quitadas e lançamentos órfãos */
export function FinanceReconcileButton({
  label = 'Limpar duplicatas',
  className = 'font-mono text-[8px] uppercase tracking-wide px-2 py-1 rounded-sl border border-line text-ink-muted hover:text-urgente hover:border-urgente/40 transition-colors min-h-[32px] disabled:opacity-50 disabled:pointer-events-none',
}: FinanceReconcileButtonProps)
{
  const reconcileFinanceLedger = useTaskStore((s) => s.reconcileFinanceLedger)
  const financeReconciling = useTaskStore((s) => s.financeReconciling)
  const transactions = useTaskStore((s) => s.transactions)
  const dupCount = countLedgerDuplicates(transactions)

  if (dupCount === 0) return null

  return (
    <button
      type="button"
      onClick={() => void reconcileFinanceLedger()}
      disabled={financeReconciling}
      className={className}
    >
      {financeReconciling ? (
        <span className="inline-flex items-center gap-1">
          <Loader2 size={10} className="animate-spin" aria-hidden />
          Recalculando…
        </span>
      ) : (
        label
      )}
    </button>
  )
}
