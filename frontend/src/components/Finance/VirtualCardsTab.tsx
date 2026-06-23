import { useEffect, useMemo, useState } from 'react'
import { Plus, Lock, Unlock, Trash2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { AddCardForm } from './AddCardForm'
import { CreditCardVisual } from './CreditCardVisual'
import { CardInvoicePanel } from './CardInvoicePanel'
import { CardInvoiceDrawer } from './CardInvoiceDrawer'
import { getBillingCycle, getInvoiceTransactions } from '../../lib/financeCardCycle'
import { getCardExtratoTransactions, sumOpenInvoiceSpend } from '../../lib/financeCardSpend'
import { cardTemCicloFatura, cardUsaExtrato } from '../../lib/financeCardModalidade'
import {
  AXEL_BTN_PRIMARY,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface VirtualCardsTabProps
{
  initialCardId?: string | null
  openInvoiceOnMount?: boolean
}

export function VirtualCardsTab({
  initialCardId = null,
  openInvoiceOnMount = false,
}: VirtualCardsTabProps)
{
  const cards = useTaskStore((s) => s.cards)
  const fetchCards = useTaskStore((s) => s.fetchCards)
  const transactions = useTaskStore((s) => s.transactions)
  const categories = useTaskStore((s) => s.categories)
  const toggleCardStatus = useTaskStore((s) => s.toggleCardStatus)
  const removeCard = useTaskStore((s) => s.removeCard)

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(cards[0]?.id ?? null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() =>
  {
    void fetchCards()
  }, [fetchCards])

  useEffect(() =>
  {
    if (cards.length === 0)
    {
      setSelectedId(null)
      return
    }
    if (!selectedId || !cards.some((c) => c.id === selectedId))
    {
      setSelectedId(cards[cards.length - 1].id)
    }
  }, [cards, selectedId])

  useEffect(() =>
  {
    if (!initialCardId) return
    if (cards.some((c) => c.id === initialCardId))
    {
      setSelectedId(initialCardId)
      if (openInvoiceOnMount) setDrawerOpen(true)
    }
  }, [initialCardId, openInvoiceOnMount, cards])

  const selected = cards.find((c) => c.id === selectedId) ?? cards[0] ?? null

  const cardData = useMemo(() =>
  {
    return cards.map((card) =>
    {
      const cycle = getBillingCycle(card)
      const invoiceTx = cardTemCicloFatura(card.modalidade)
        ? getInvoiceTransactions(transactions, card.id, cycle)
        : getCardExtratoTransactions(transactions, card.id)
      const invoiceTotal = sumOpenInvoiceSpend(transactions, card)
      return { card, cycle, invoiceTx, invoiceTotal }
    })
  }, [cards, transactions])

  const selectedData = cardData.find((d) => d.card.id === selected?.id)

  const openFatura = (cardId: string) =>
  {
    setSelectedId(cardId)
    const isMobile = typeof window !== 'undefined'
      && window.matchMedia('(max-width: 1023px)').matches
    if (isMobile) setDrawerOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="min-w-0">
        <p className={`font-mono text-[10px] uppercase tracking-wide ${AXEL_TEXT_SECONDARY}`}>
          Cartões e benefícios
        </p>
        <p className={`text-[12px] sm:text-sm mt-0.5 ${AXEL_TEXT_PRIMARY}`}>
          Deslize para ver todos · toque para selecionar
        </p>
      </div>

      {showAddForm && (
        <AddCardForm onClose={() => setShowAddForm(false)} />
      )}

      {!showAddForm && (
        cards.length === 0 ? (
        <div className="border border-dashed border-line rounded-sl py-12 sm:py-16 text-center px-4">
          <p className={`text-sm ${AXEL_TEXT_SECONDARY}`}>Nenhum cartão cadastrado</p>
          <p className={`text-[11px] mt-2 ${AXEL_TEXT_SECONDARY}`}>
            Toque em <strong className="text-ink">Novo cartão</strong> no canto inferior.
          </p>
        </div>
        ) : (
        <>
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {cardData.map(({ card, cycle, invoiceTotal }) => (
              <div key={card.id} className="snap-center shrink-0 w-[min(88vw,280px)] sm:w-[260px]">
                <CreditCardVisual
                  card={card}
                  cycle={cycle}
                  invoiceTotal={invoiceTotal}
                  selected={selected?.id === card.id}
                  onClick={() => openFatura(card.id)}
                />
              </div>
            ))}
          </div>

          {selectedData && (
            <div className="hidden lg:block space-y-3 min-w-0">
              <div className="flex flex-wrap gap-2 items-center">
                <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase ${AXEL_TEXT_SECONDARY}`}>
                  <FileText size={12} />
                  {cardUsaExtrato(selectedData.card.modalidade) ? 'Extrato' : 'Fatura'} · {selectedData.card.nome}
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="font-mono text-[9px] uppercase text-accent hover:underline"
                >
                  Abrir painel lateral
                </button>
                <button
                  type="button"
                  onClick={() => toggleCardStatus(selectedData.card.id)}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] font-mono text-[10px] uppercase px-3 py-2 border border-line rounded-sl hover:bg-chrome text-ink-muted"
                >
                  {selectedData.card.status === 'bloqueado' ? (
                    <><Unlock size={12} /> Desbloquear</>
                  ) : (
                    <><Lock size={12} /> Bloquear</>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                  {
                    if (confirm('Excluir este cartão?'))
                    {
                      removeCard(selectedData.card.id)
                      setSelectedId(cards.find((c) => c.id !== selectedData.card.id)?.id ?? null)
                      toast.success('Cartão removido')
                    }
                  }}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] font-mono text-[10px] uppercase px-3 py-2 border border-line rounded-sl hover:bg-chrome text-urgente"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>
              </div>

              <CardInvoicePanel
                card={selectedData.card}
                cycle={selectedData.cycle}
                invoiceTx={selectedData.invoiceTx}
                invoiceTotal={selectedData.invoiceTotal}
                categories={categories}
              />
            </div>
          )}
        </>
        )
      )}

      {!showAddForm && selectedData && (
        <CardInvoiceDrawer
          open={drawerOpen}
          card={selectedData.card}
          cycle={selectedData.cycle}
          invoiceTx={selectedData.invoiceTx}
          invoiceTotal={selectedData.invoiceTotal}
          categories={categories}
          onClose={() => setDrawerOpen(false)}
        />
      )}

      {!showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className={`fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-3 z-40 inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 font-mono text-[10px] uppercase tracking-wide shadow-lg ${AXEL_BTN_PRIMARY}`}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo cartão</span>
          <span className="sm:hidden">Novo</span>
        </button>
      )}
    </div>
  )
}
