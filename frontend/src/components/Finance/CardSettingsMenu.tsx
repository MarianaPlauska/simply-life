import { FileText, Lock, Pencil, Trash2, Unlock } from 'lucide-react'
import type { VirtualCard } from '../../store/storeTypes'
import { cardUsaExtrato } from '../../lib/financeCardModalidade'

interface CardSettingsMenuProps
{
  card: VirtualCard
  onEdit: () => void
  onViewInvoice: () => void
  onToggleBlock: () => void
  onDelete: () => void
  onClose: () => void
}

export function CardSettingsMenu({
  card,
  onEdit,
  onViewInvoice,
  onToggleBlock,
  onDelete,
  onClose,
}: CardSettingsMenuProps)
{
  const itemClass =
    'w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] text-left font-mono text-[10px] uppercase tracking-wide hover:bg-chrome transition-colors'

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-30"
        aria-label="Fechar menu"
        onClick={onClose}
      />
      <div
        className="absolute top-10 right-2 z-40 min-w-[168px] rounded-sl border border-line bg-card shadow-lg py-1 overflow-hidden"
        role="menu"
      >
        <button type="button" role="menuitem" className={itemClass} onClick={onEdit}>
          <Pencil size={12} className="text-accent" />
          Editar
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={onViewInvoice}>
          <FileText size={12} className="text-ink-muted" />
          {cardUsaExtrato(card.modalidade) ? 'Ver extrato' : 'Ver fatura'}
        </button>
        <button type="button" role="menuitem" className={itemClass} onClick={onToggleBlock}>
          {card.status === 'bloqueado' ? (
            <><Unlock size={12} className="text-ink-muted" /> Desbloquear</>
          ) : (
            <><Lock size={12} className="text-ink-muted" /> Bloquear</>
          )}
        </button>
        <button
          type="button"
          role="menuitem"
          className={`${itemClass} text-urgente`}
          onClick={onDelete}
        >
          <Trash2 size={12} />
          Excluir
        </button>
      </div>
    </>
  )
}
