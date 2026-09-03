import { useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../../store/useTaskStore'
import { buildUpcomingBills, type UpcomingBill } from '../../../lib/financeUpcomingBills'
import { dismissDueBill } from '../../../hooks/useFinanceDueNotifications'
import { computeCashPosition } from '../../../lib/financeReservedBills'
import {
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import type { Transaction } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const UPCOMING_LIMIT = 3

interface FinanceUpcomingBillsListProps
{
  transactions: Transaction[]
  onNewBill?: () => void
}

export function FinanceUpcomingBillsList({
  transactions,
  onNewBill,
}: FinanceUpcomingBillsListProps)
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const cards = useTaskStore((s) => s.cards)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cashAccount = useTaskStore((s) => s.cashAccount)
  const markTransactionPaid = useTaskStore((s) => s.markTransactionPaid)
  const saldoCorrente = useMemo(
    () => computeCashPosition(transactions, cashAccount.saldo_inicial, reservedBills).saldoCorrente,
    [transactions, cashAccount.saldo_inicial, reservedBills],
  )
  const payCardInvoice = useTaskStore((s) => s.payCardInvoice)

  const [tick, setTick] = useState(0)

  const upcoming = useMemo(
    () => buildUpcomingBills({
      contasFixas,
      cards,
      transactions,
      reservedBills,
    }).slice(0, UPCOMING_LIMIT),
    [contasFixas, cards, transactions, reservedBills, tick],
  )

  const upcomingTotal = upcoming.reduce((s, b) => s + b.valor, 0)

  const handlePaid = async (bill: UpcomingBill) =>
  {
    if (bill.transactionId)
    {
      await markTransactionPaid(bill.transactionId)
    }
    else if (bill.cardId && bill.kind === 'cartao_fatura')
    {
      const res = await payCardInvoice(bill.cardId)
      if (!res.ok)
      {
        toast.error(res.message)
        return
      }
    }

    dismissDueBill(bill.id)
    setTick((t) => t + 1)
    toast.success('Marcado como pago')
  }

  return (
    <div className="border-t border-line pt-4">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={14} className="text-accent" />
          <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
            Próximas 3 contas a pagar
          </p>
        </div>
        <div className="flex items-center gap-2">
          {upcoming.length > 0 && (
            <span className="font-mono text-[10px] tabular-nums text-atencao">
              {fmt(upcomingTotal)}
            </span>
          )}
          {onNewBill && (
            <button
              type="button"
              onClick={onNewBill}
              className="inline-flex items-center gap-1 font-mono text-[9px] uppercase text-accent hover:underline min-h-[36px] px-2"
            >
              <Plus size={12} />
              Lançar
            </button>
          )}
        </div>
      </header>

      {upcoming.length === 0 ? (
        <p className={`text-[12px] py-4 text-center ${AXEL_TEXT_SECONDARY}`}>
          Nenhuma conta prevista - cadastre fixas ou lance um pagamento agendado.
        </p>
      ) : (
        <ul className="divide-y divide-line border border-line rounded-sl overflow-hidden">
          {upcoming.map((bill) =>
          {
            const urgent = bill.daysUntil <= 3
            const soon = bill.daysUntil <= 7
            const toneClass = urgent ? 'text-urgente' : soon ? 'text-atencao' : 'text-ink-muted'
            return (
              <li
                key={bill.id}
                className={`flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 ${AXEL_ROW_HOVER}`}
              >
                <div className="min-w-0 flex items-start gap-2 flex-1">
                  {urgent ? (
                    <AlertCircle size={14} className="text-urgente shrink-0 mt-0.5" />
                  ) : (
                    <CalendarClock size={14} className={`shrink-0 mt-0.5 ${toneClass}`} />
                  )}
                  <div className="min-w-0">
                    <p className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>{bill.label}</p>
                    <p className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                      {bill.dueDate.split('-').reverse().join('/')}
                      {bill.hint ? ` · ${bill.hint}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className={`font-mono text-[12px] tabular-nums ${AXEL_TEXT_PRIMARY}`}>{fmt(bill.valor)}</p>
                    <p className={`font-mono text-[9px] uppercase ${toneClass}`}>
                      {bill.daysUntil === 0 ? 'Hoje' : `em ${bill.daysUntil}d`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handlePaid(bill)}
                    className="inline-flex items-center gap-1 px-3 py-2 min-h-[44px] font-mono text-[10px] uppercase rounded-sl border border-accent/35 bg-accent/12 text-accent transition-all duration-200 active:scale-[0.98] hover:bg-accent hover:text-white hover:border-accent md:min-h-[36px] md:px-2.5 md:py-1.5 md:bg-transparent md:text-ink-muted md:border-line md:hover:bg-concluido md:hover:text-white md:hover:border-concluido/50"
                  >
                    <Check size={12} />
                    Pago
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <p className={`font-mono text-[9px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
        Caixa corrente: {fmt(saldoCorrente)} - alertas no sino ao entrar no app (≤3 dias).
      </p>
    </div>
  )
}
