import { Plus, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { AXEL_HEADER_ACTION } from '../../constants/axelSurfaces'
import { captureIntentFromPath, captureIntentLabel } from '../../lib/captureIntent'
import { useCapture } from './CaptureProvider'

interface CapturePlusButtonProps
{
  placement: 'nav' | 'header'
}

export function CapturePlusButton({ placement }: CapturePlusButtonProps)
{
  const { sheetOpen, toggleSheet } = useCapture()
  const pathname = useLocation().pathname
  const intent = captureIntentFromPath(pathname)
  const label = captureIntentLabel(intent, sheetOpen)

  if (placement === 'header')
  {
    return (
      <button
        type="button"
        onClick={toggleSheet}
        aria-expanded={sheetOpen}
        aria-label={label}
        title={label}
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
      title={label}
      className="relative z-10 w-10 h-10 rounded-full border border-line bg-elevated text-ink flex items-center justify-center shrink-0 active:scale-95 transition-transform"
    >
      {sheetOpen ? <X size={18} strokeWidth={2} /> : <Plus size={20} strokeWidth={2} />}
    </button>
  )
}
