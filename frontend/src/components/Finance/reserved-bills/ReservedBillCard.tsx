import { ChevronDown, CreditCard, Wallet, X } from 'lucide-react'
import { toast } from 'sonner'
import { billProgress, billRemaining } from '../../../lib/financeReservedBills'
import {
  daysUntilDue,
  formatDueLabel,
  resolveBillVisualStatus,
} from '../../../lib/financeBillVisual'
import {
  dueDateTone,
  resolveBillCardSurface,
  STATUS_BADGE_SOFT,
  STATUS_LABEL,
} from '../../../lib/financeBillCardStyle'
import { useReservedBillItems } from '../../../hooks/useReservedBillItems'
import { ReservedBillDiscriminants } from './ReservedBillDiscriminants'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../../constants/axelSurfaces'
import type { ReservedBill, ReservedBillItem, VirtualCard } from '../../../store/storeTypes'

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

interface ReservedBillCardProps
{
  bill: ReservedBill
  cards: VirtualCard[]
  expanded: boolean
  onToggle: () => void
  onRecordSpend: (billId: number, valor: number) => Promise<void>
  onCancel: (id: number) => Promise<void>
  onAddItem: (
    billId: number,
    item: Omit<ReservedBillItem, 'id' | 'fatura_reserva_id'>,
  ) => Promise<void>
  onRemoveItem: (id: number) => Promise<void>
  spendBillId: number | null
  setSpendBillId: (id: number | null) => void
  spendVal: string
  setSpendVal: (v: string) => void
}

export function ReservedBillCard({
  bill,
  cards,
  expanded,
  onToggle,
  onRecordSpend,
  onCancel,
  onAddItem,
  onRemoveItem,
  spendBillId,
  setSpendBillId,
  spendVal,
  setSpendVal,
}: ReservedBillCardProps)
{
  const items = useReservedBillItems(bill.id)
  const pct = billProgress(bill)
  const rest = billRemaining(bill)
  const days = daysUntilDue(bill.data_vencimento)
  const status = resolveBillVisualStatus(bill, items)
  const surface = resolveBillCardSurface(bill, cards)
  const statusLabel = STATUS_LABEL[status]
  const statusBadge = STATUS_BADGE_SOFT[status]

  const card = bill.card_id ? cards.find((c) => c.id === bill.card_id) : null

  const handleManualSpend = async () =>
  {
    const v = parseFloat(spendVal.replace(',', '.'))
    if (Number.isNaN(v) || v <= 0)
    {
      toast.error('Informe o valor gasto')
      return
    }
    await onRecordSpend(bill.id, v)
    await onAddItem(bill.id, { descricao: 'Abatimento manual', valor: v })
    setSpendBillId(null)
    setSpendVal('')
    toast.success('Gasto abatido da fatura')
  }

  return (
    <li
      className={`rounded-sl border overflow-hidden transition-colors ${surface.border} ${surface.bg}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex min-h-[4.5rem]"
      >
        <span className={`hidden sm:block w-1 shrink-0 ${surface.stripe}`} aria-hidden />

        <div className="flex-1 min-w-0 px-3 py-2.5 sm:py-3 w-full">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <span className={`w-2 h-2 rounded-full shrink-0 ${surface.dot}`} aria-hidden />
                <p className={`text-sm sm:text-base font-medium truncate ${AXEL_TEXT_PRIMARY}`}>
                  {bill.titulo}
                </p>
                {statusLabel && statusBadge && (
                  <span className={`shrink-0 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded-sl border ${statusBadge}`}>
                    {statusLabel}
                  </span>
                )}
              </div>
              <p className={`font-mono text-[10px] sm:text-[11px] flex flex-wrap items-center gap-1 ${AXEL_TEXT_SECONDARY}`}>
                {card ? (
                  <>
                    <CreditCard size={11} className="shrink-0 opacity-60" />
                    {card.nome}
                  </>
                ) : (
                  <>
                    <Wallet size={11} className="shrink-0 opacity-60" />
                    Conta corrente
                  </>
                )}
                <span className="opacity-30">·</span>
                <span className={dueDateTone(days)}>
                  {bill.data_vencimento.split('-').reverse().join('/')} ({formatDueLabel(days)})
                </span>
                {items.length > 0 && (
                  <>
                    <span className="opacity-30">·</span>
                    <span>{items.length} itens</span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <p className={`font-mono text-lg sm:text-xl font-semibold tabular-nums leading-none ${surface.accent}`}>
                  {pct.toFixed(0)}%
                </p>
                <p className={`font-mono text-[10px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
                  {fmt(rest)} livre
                </p>
              </div>
              <ChevronDown
                size={18}
                className={`text-ink-muted/70 transition-transform ${expanded ? 'rotate-180' : ''}`}
              />
            </div>
          </div>

          <div className={`mt-2.5 h-2 rounded-sl overflow-hidden ${surface.progressTrack}`}>
            <div
              className={`h-full rounded-sl transition-all ${surface.progress}`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <p className={`font-mono text-[11px] sm:text-xs tabular-nums ${AXEL_TEXT_PRIMARY}`}>
              Gasto <strong>{fmt(bill.valor_gasto)}</strong>
              <span className={`mx-1.5 ${AXEL_TEXT_SECONDARY}`}>de</span>
              <strong>{fmt(bill.valor_alocado)}</strong>
            </p>
            {!expanded && (
              <p className={`font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                Toque para detalhes
              </p>
            )}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-line/50 bg-card/40 px-3 pb-3 pt-2">
          <div className="flex flex-wrap gap-2 mb-3">
            {spendBillId === bill.id ? (
              <>
                <input
                  inputMode="decimal"
                  value={spendVal}
                  onChange={(e) => setSpendVal(e.target.value)}
                  placeholder="Quanto gastou?"
                  className="flex-1 min-w-[140px] border border-line rounded-sl bg-chrome px-3 py-2 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => void handleManualSpend()}
                  className={`px-4 py-2 font-mono text-[10px] uppercase ${AXEL_BTN_PRIMARY}`}
                >
                  Abater
                </button>
                <button
                  type="button"
                  onClick={() => setSpendBillId(null)}
                  className="p-2 text-ink-muted"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setSpendBillId(bill.id); setSpendVal('') }}
                  className="font-mono text-[10px] uppercase px-3 py-1.5 rounded-sl border border-line hover:bg-chrome text-accent"
                >
                  Registrar gasto
                </button>
                <button
                  type="button"
                  onClick={() => void onCancel(bill.id)}
                  className="font-mono text-[10px] uppercase px-3 py-1.5 rounded-sl border border-line hover:bg-chrome text-ink-muted hover:text-urgente"
                >
                  Cancelar reserva
                </button>
              </>
            )}
          </div>

          <ReservedBillDiscriminants
            bill={bill}
            items={items}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            compact
          />
        </div>
      )}
    </li>
  )
}
