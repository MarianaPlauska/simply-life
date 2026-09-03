import { AlertTriangle } from 'lucide-react'
import type { VirtualCard } from '../../store/storeTypes'
import {
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface CardDeleteDialogProps
{
  card: VirtualCard | null
  onConfirm: () => void
  onCancel: () => void
}

export function CardDeleteDialog({ card, onConfirm, onCancel }: CardDeleteDialogProps)
{
  if (!card) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="card-delete-title"
      aria-describedby="card-delete-desc"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
        aria-label="Cancelar exclusão"
      />
      <div className="relative w-full sm:max-w-sm border border-line rounded-sl bg-card shadow-2xl p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-sl bg-urgente/10 border border-urgente/25 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-urgente" />
          </div>
          <div className="min-w-0">
            <h4 id="card-delete-title" className={`text-sm font-semibold ${AXEL_TEXT_PRIMARY}`}>
              Excluir &quot;{card.nome}&quot;?
            </h4>
            <p id="card-delete-desc" className={`text-[12px] mt-1.5 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              O cartão some da lista. Lançamentos antigos podem ficar sem cartão vinculado - o histórico financeiro não é apagado.
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-[44px] px-4 py-2.5 border border-line rounded-sl font-mono text-[10px] uppercase text-ink-muted hover:bg-chrome"
          >
            Manter cartão
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-[44px] px-4 py-2.5 font-mono text-[10px] uppercase bg-urgente hover:bg-urgente/90 text-white rounded-sl"
          >
            Excluir cartão
          </button>
        </div>
      </div>
    </div>
  )
}
