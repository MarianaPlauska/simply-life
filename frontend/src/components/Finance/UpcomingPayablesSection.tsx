import { useEffect, useMemo } from 'react'
import { AlertCircle, Calendar, QrCode, Receipt } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { buildUpcomingBills } from '../../lib/financeUpcomingBills'
import { payablesDedupKey } from '../../lib/financePayablesDedup'
import { isPaidInSettlements } from '../../lib/financeLedgerReconcile'
import { isBillDismissed } from '../../lib/financeBillDismiss'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import type { UpcomingBill } from '../../lib/financeUpcomingBills'
import type { FinanceBillSettlement } from '../../store/storeTypes'
import type { TarefaUnificada } from '../../types'

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

function parseValorFromTitulo(titulo: string): number
{
  const m = titulo.match(/R\$\s*([\d.,]+)/i)
  if (!m?.[1]) return 0
  const raw = m[1].includes(',')
    ? m[1].replace(/\./g, '').replace(',', '.')
    : m[1]
  const n = Number.parseFloat(raw)
  return Number.isFinite(n) ? n : 0
}

function payableResolvedByTasks(bill: UpcomingBill, tarefas: TarefaUnificada[]): boolean
{
  const nome = bill.label.toLowerCase().replace(/\s*\[fixa:\d+\]/gi, '').trim()
  const month = bill.dueDate.slice(0, 7)

  return tarefas.some((t) =>
  {
    if (t.status !== 'concluida') return false
    const titulo = t.titulo.toLowerCase()
    if (!titulo.includes('boleto') && t.origem !== 'financeiro' && !titulo.startsWith('📄'))
    {
      return false
    }
    if (!titulo.includes(nome)) return false
    const valor = parseValorFromTitulo(t.titulo)
    if (valor > 0 && Math.abs(valor - bill.valor) > 0.02) return false
    const tMonth = (t.data_vencimento ?? '').slice(0, 7)
    return !tMonth || tMonth === month
  })
}

function payableResolvedBySettlements(
  bill: UpcomingBill,
  settlements: FinanceBillSettlement[],
): boolean
{
  if (isPaidInSettlements(bill.label, bill.valor, settlements))
  {
    return true
  }

  const key = payablesDedupKey(bill)
  return settlements.some((s) => s.bill_id === `tx:${key}`)
}

/** PIX, boletos avulsos e lançamentos futuros — lembrete visual como nas fixas */
export function UpcomingPayablesSection()
{
  const contasFixas = useTaskStore((s) => s.contasFixas)
  const reservedBills = useTaskStore((s) => s.reservedBills)
  const cards = useTaskStore((s) => s.cards)
  const transactions = useTaskStore((s) => s.transactions)
  const tarefas = useTaskStore((s) => s.tarefas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const markTransactionPaid = useTaskStore((s) => s.markTransactionPaid)
  const markReservedBillPaid = useTaskStore((s) => s.markReservedBillPaid)
  const fetchBillSettlements = useTaskStore((s) => s.fetchBillSettlements)

  useEffect(() =>
  {
    void fetchBillSettlements()
  }, [fetchBillSettlements])

  const handleMarkPaid = async (bill: UpcomingBill) =>
  {
    if (bill.transactionId != null)
    {
      await markTransactionPaid(bill.transactionId)
    }
    else if (bill.reservedBillId != null)
    {
      await markReservedBillPaid(bill.reservedBillId)
    }
    void fetchBillSettlements()
  }

  const canMarkPaid = (bill: UpcomingBill) =>
    bill.transactionId != null || bill.reservedBillId != null

  const payables = useMemo(() =>
  {
    return buildUpcomingBills({
      contasFixas,
      reservedBills,
      cards,
      transactions,
      horizonDays: 45,
    }).filter((b) =>
    {
      if (b.kind !== 'agendado' && b.kind !== 'pendente' && b.kind !== 'fatura_reserva')
      {
        return false
      }
      if (isBillDismissed(b.id)) return false
      if (payableResolvedBySettlements(b, billSettlements)) return false
      if (payableResolvedByTasks(b, tarefas)) return false
      return true
    })
  }, [contasFixas, reservedBills, cards, transactions, tarefas, billSettlements])

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
                  {canMarkPaid(bill) && (
                    <button
                      type="button"
                      onClick={() => void handleMarkPaid(bill)}
                      className="font-mono text-[9px] uppercase px-2.5 py-1.5 rounded-sl border border-accent/45 bg-accent/12 text-accent hover:bg-accent/20 min-h-[36px] shadow-sm"
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
