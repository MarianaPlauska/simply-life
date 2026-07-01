import { useMemo } from 'react'
import { AlertCircle, Calendar, QrCode, Receipt } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildUpcomingBills } from '../../lib/financeUpcomingBills'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const fmtBr = (iso: string) => iso.split('-').reverse().join('/')

function kindIcon(kind: string)
{
  if (kind === 'agendado' || kind === 'pendente') return QrCode
  return Receipt
}

function kindLabel(kind: string, hint?: string): string
{
  if (hint?.toLowerCase().includes('pix')) return 'PIX'
  if (kind === 'agendado') return 'Agendado'
  if (kind === 'pendente') return 'A pagar'
  if (kind === 'fatura_reserva') return 'Reserva'
  return 'Conta'
}

/** PIX, boletos avulsos e lançamentos futuros — lembrete visual como nas fixas */
export function UpcomingPayablesSection()
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)
  const markTransactionPaid = useTaskStore((s) => s.markTransactionPaid)

  const payables = useMemo(() =>
  {
    return buildUpcomingBills({
      contasFixas,
      reservedBills,
      cards,
      transactions,
      horizonDays: 45,
    }).filter((b) =>
      b.kind === 'agendado'
      || b.kind === 'pendente'
      || b.kind === 'fatura_reserva',
    )
  }, [contasFixas, reservedBills, cards, transactions])

  if (payables.length === 0) return null

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} p-0 overflow-hidden`}>
      <header className="px-3 py-2.5 border-b border-line bg-chrome/30">
        <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Próximos pagamentos
        </p>
        <p className={`text-[11px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
          PIX, boletos e contas avulsas — lembrete no Kanban 1 dia antes.
        </p>
      </header>
      <ul className="divide-y divide-line">
        {payables.map((bill) =>
        {
          const Icon = kindIcon(bill.kind)
          const isClose = bill.daysUntil <= 3
          const isToday = bill.daysUntil === 0
          const isTomorrow = bill.daysUntil === 1

          return (
            <li
              key={bill.id}
              className={`p-2.5 sm:p-3 ${isClose ? 'bg-urgente/5' : AXEL_ROW_HOVER}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-sl flex items-center justify-center border shrink-0 ${
                  isClose ? 'border-urgente/30 bg-urgente/10 text-urgente' : 'border-line bg-card text-ink-muted'
                }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[12px] font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                      {bill.label}
                    </span>
                    <span className="font-mono text-[8px] uppercase px-1 py-0.5 rounded-sl border border-line/70 text-ink-muted">
                      {kindLabel(bill.kind, bill.hint)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 mt-0.5 font-mono text-[10px] text-ink-muted">
                    <span className="tabular-nums text-urgente">{fmt(bill.valor)}</span>
                    <span className="inline-flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {fmtBr(bill.dueDate)}
                    </span>
                    {bill.hint && (
                      <span className="truncate max-w-[8rem]">{bill.hint}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {isToday ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase text-urgente">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Hoje
                    </span>
                  ) : isTomorrow ? (
                    <span className="text-[9px] font-mono uppercase text-atencao">Amanhã</span>
                  ) : isClose ? (
                    <span className="text-[9px] font-mono uppercase text-atencao">
                      {bill.daysUntil}d
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-ink-muted">
                      {bill.daysUntil}d
                    </span>
                  )}
                  {bill.transactionId != null && (
                    <button
                      type="button"
                      onClick={() => void markTransactionPaid(bill.transactionId!)}
                      className="font-mono text-[9px] uppercase text-accent hover:underline"
                    >
                      Marcar pago
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
