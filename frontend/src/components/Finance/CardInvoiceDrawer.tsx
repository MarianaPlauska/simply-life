import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronUp, X } from 'lucide-react'
import { CardInvoicePanel } from './CardInvoicePanel'
import type { BillingCycle } from '../../lib/financeCardCycle'
import type { Category, Transaction, VirtualCard } from '../../store/storeTypes'
import { cardUsaExtrato } from '../../lib/financeCardModalidade'
import { useMobileSnapSheet } from '../../hooks/useMobileSnapSheet'
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

// Fatura / extrato do cartão — bottom sheet com snap no mobile (como Grupos)

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
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  )

  const {
    snap,
    sheetStyle,
    expand,
    collapse,
    handleProps,
  } = useMobileSnapSheet({ open, onClose, enabled: isMobile })

  useEffect(() =>
  {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  if (!open || !card || !cycle) return null

  const tituloPainel = cardUsaExtrato(card.modalidade)
    ? `Extrato · ${card.nome}`
    : `Fatura · ${card.nome}`

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end lg:items-stretch justify-center lg:justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-invoice-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div
        className="relative w-full lg:max-w-lg flex flex-col overflow-hidden rounded-t-sl lg:rounded-none border border-line bg-card shadow-2xl lg:h-full mb-[calc(4.25rem+env(safe-area-inset-bottom,0px))] lg:mb-0"
        style={isMobile ? sheetStyle : undefined}
      >
        <div
          className="shrink-0 flex flex-col items-center pt-2 pb-1 lg:hidden touch-none cursor-grab active:cursor-grabbing"
          {...handleProps}
          onDoubleClick={expand}
          aria-hidden={!isMobile}
        >
          <div className="w-10 h-1 rounded-full bg-line mb-2" />
          <button
            type="button"
            onClick={() => (snap === 'expanded' ? collapse() : expand())}
            className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-ink-muted px-3 py-1"
            aria-label={snap === 'expanded' ? 'Recolher painel' : 'Expandir painel'}
          >
            <ChevronUp
              size={12}
              className={`transition-transform ${snap === 'expanded' ? 'rotate-180' : ''}`}
            />
            {snap === 'expanded' ? 'Arraste para recolher' : 'Arraste para ver tudo'}
          </button>
        </div>

        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <h3 id="card-invoice-title" className={`text-sm font-display uppercase tracking-wide ${AXEL_TEXT_PRIMARY}`}>
              {tituloPainel}
            </h3>
            {!cardUsaExtrato(card.modalidade) && (
              <p className="font-mono text-[10px] text-ink-muted mt-0.5">{cycle.label}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-sl hover:bg-chrome text-ink-muted shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4">
          <CardInvoicePanel
            card={card}
            cycle={cycle}
            invoiceTx={invoiceTx}
            invoiceTotal={invoiceTotal}
            categories={categories}
            variant="drawer"
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}
