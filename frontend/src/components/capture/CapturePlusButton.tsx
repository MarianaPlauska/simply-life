import { Plus, X } from 'lucide-react'
import { AXEL_BTN_PRIMARY, AXEL_HEADER_ACTION, AXEL_TOUCH_PRESS } from '../../constants/axelSurfaces'
import { useCapture } from './CaptureProvider'

interface CapturePlusButtonProps
{
  placement: 'nav' | 'header'
}

export function CapturePlusButton({ placement }: CapturePlusButtonProps)
{
  const { sheetOpen, toggleSheet } = useCapture()
  const label = sheetOpen ? 'Fechar captura' : 'Capturar tarefa, gasto ou água'

  if (placement === 'header')
  {
    return (
      <button
        type="button"
        onClick={toggleSheet}
        aria-expanded={sheetOpen}
        aria-label={label}
        title="Capturar"
        className={`hidden md:inline-flex ${AXEL_HEADER_ACTION}`}
      >
        {sheetOpen ? <X size={20} strokeWidth={1.75} /> : <Plus size={20} strokeWidth={1.75} />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleSheet}
      aria-expanded={sheetOpen}
      aria-label={label}
      className={`relative z-10 -mt-4 w-11 h-11 rounded-full shadow-sl-lg flex items-center justify-center shrink-0 ${AXEL_BTN_PRIMARY} ${AXEL_TOUCH_PRESS}`}
    >
      {sheetOpen ? <X size={18} strokeWidth={2} /> : <Plus size={20} strokeWidth={2} />}
    </button>
  )
}
