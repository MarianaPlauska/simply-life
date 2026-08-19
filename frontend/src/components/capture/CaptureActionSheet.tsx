import { Droplets, ListPlus, Wallet, X } from 'lucide-react'
import { AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'

interface CaptureActionSheetProps
{
  open: boolean
  savingWater: boolean
  onClose: () => void
  onTask: () => void
  onFinance: () => void
  onWater: () => void
}

/** Folha compacta acima da barra: tarefa, gasto, água. */
export function CaptureActionSheet({
  open,
  savingWater,
  onClose,
  onTask,
  onFinance,
  onWater,
}: CaptureActionSheetProps)
{
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center md:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fechar captura"
        onClick={onClose}
      />
      <div className="relative w-full md:max-w-sm border border-line bg-card rounded-t-sl md:rounded-sl shadow-sl-lg p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] md:mb-0 mb-[calc(3.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between mb-2">
          <p className="sl-eyebrow text-axel">Capturar</p>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 text-ink-muted hover:text-ink ${AXEL_TOUCH_PRESS}`}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <CaptureChoice icon={ListPlus} label="Tarefa" onClick={onTask} />
          <CaptureChoice icon={Wallet} label="Gasto" onClick={onFinance} />
          <CaptureChoice
            icon={Droplets}
            label="+ Água"
            disabled={savingWater}
            onClick={onWater}
          />
        </div>
      </div>
    </div>
  )
}

function CaptureChoice({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof ListPlus
  label: string
  onClick: () => void
  disabled?: boolean
})
{
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 min-h-11 rounded-sl border border-line bg-chrome/60 text-ink ${AXEL_TOUCH_PRESS} disabled:opacity-40`}
    >
      <Icon size={16} strokeWidth={1.75} />
      <span className="text-[11px] font-semibold">{label}</span>
    </button>
  )
}
