import { useEffect, useState } from 'react'
import { Flame, X } from 'lucide-react'

// Tela de marco — ofensiva 7 / 30 / 100 dias

interface MilestoneDetail
{
  days: number
}

export function CelebrationOverlay()
{
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState(0)

  useEffect(() =>
  {
    const handler = (e: Event) =>
    {
      const detail = (e as CustomEvent<MilestoneDetail>).detail
      if (!detail?.days) return
      setDays(detail.days)
      setOpen(true)
    }
    window.addEventListener('axel-milestone', handler)
    return () => window.removeEventListener('axel-milestone', handler)
  }, [])

  if (!open)
  {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-labelledby="milestone-title"
    >
      <div className="relative w-full max-w-sm rounded-sl border border-orange-500/30 bg-card p-6 text-center shadow-xl achievement-pop-in">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 p-1 text-ink-muted hover:text-ink"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>
        <Flame className="w-10 h-10 text-orange-500 mx-auto mb-3" strokeWidth={1.5} />
        <h2 id="milestone-title" className="font-display text-2xl text-ink">
          {days} dias de ofensiva
        </h2>
        <p className="text-sm text-ink-muted mt-2 leading-relaxed">
          Marco alcançado. Você construiu um hábito real de execução — continue amanhã.
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-5 w-full font-mono text-[11px] uppercase tracking-wide py-2.5 rounded-sl border border-line hover:bg-chrome/40 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
