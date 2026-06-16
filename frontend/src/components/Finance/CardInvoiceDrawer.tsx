import { X } from 'lucide-react'
import { CardInvoicePanel } from './CardInvoicePanel'
import type { BillingCycle } from '../../lib/financeCardCycle'
import type { Category, Transaction, VirtualCard } from '../../store/storeTypes'
import { AXEL_TEXT_PRIMARY } from '../../constants/axelSurfaces'

interface CardInvoiceDrawerProps
{
  open: boolean
  card: VirtualCard | null
  cycle: BillingCycle | null
  invoiceTx: Transaction[]
  invoiceTotal: number
  categories: Category[]
  onClose: () => void
}

// Fatura individual do cartão — drawer mobile-first, também em desktop

export function CardInvoiceDrawer({
  open,
  card,
  cycle,
  invoiceTx,
  invoiceTotal,
  categories,
  onClose,
}: CardInvoiceDrawerProps)
{
  if (!open || !card || !cycle) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar fatura"
      />
      <div
        className="fixed inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50 flex flex-col w-full sm:max-w-lg max-h-[min(92vh,100dvh)] sm:max-h-none sm:h-full border border-line bg-card shadow-2xl rounded-t-sl sm:rounded-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-invoice-title"
      >
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <h3 id="card-invoice-title" className={`text-sm font-display uppercase tracking-wide ${AXEL_TEXT_PRIMARY}`}>
              Fatura · {card.nome}
            </h3>
            <p className="font-mono text-[10px] text-ink-muted mt-0.5">{cycle.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-sl hover:bg-chrome text-ink-muted shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-0">
          <CardInvoicePanel
            card={card}
            cycle={cycle}
            invoiceTx={invoiceTx}
            invoiceTotal={invoiceTotal}
            categories={categories}
          />
        </div>
      </div>
    </>
  )
}
