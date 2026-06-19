import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { AxelSystemGuide } from './AxelSystemGuide'
import { hasSeenSystemGuide, markSystemGuideSeen } from '../../lib/axelSystemGuideContent'

/** Modal na primeira sessão — guia passo a passo (score, prazos, foco) */
export function AxelSystemGuideIntro()
{
  const [open, setOpen] = useState(false)

  useEffect(() =>
  {
    if (!hasSeenSystemGuide())
    {
      setOpen(true)
    }
  }, [])

  if (!open)
  {
    return null
  }

  const close = () =>
  {
    markSystemGuideSeen()
    setOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3 sm:p-6 bg-black/55">
      <div
        className="w-full max-w-lg max-h-[min(90dvh,640px)] overflow-y-auto rounded-sl border border-line bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-guide-title"
      >
        <div className="sticky top-0 flex items-center justify-between gap-2 px-4 py-3 border-b border-line bg-card">
          <p id="system-guide-title" className="font-mono text-[10px] uppercase tracking-wide text-accent">
            Bem-vindo ao Simply-Life
          </p>
          <button
            type="button"
            onClick={close}
            className="p-2 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome"
            aria-label="Fechar guia"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-3 sm:p-4">
          <AxelSystemGuide compact wizard onWizardComplete={close} />
        </div>
      </div>
    </div>
  )
}
