import { useEffect, useRef, useState } from 'react'
import { Info } from 'lucide-react'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../../constants/axelSurfaces'

interface FinanceTxLabelProps
{
  label: string
  observacao?: string | null
  className?: string
}

/** Nome do lançamento com popover quando há nota explicativa */
export function FinanceTxLabel({ label, observacao, className = '' }: FinanceTxLabelProps)
{
  const note = observacao?.trim()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    if (!open) return

    const onPointer = (e: MouseEvent | TouchEvent) =>
    {
      if (!rootRef.current?.contains(e.target as Node))
      {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    return () =>
    {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
    }
  }, [open])

  if (!note)
  {
    return (
      <p className={`truncate ${AXEL_TEXT_PRIMARY} ${className}`}>
        {label}
      </p>
    )
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`group inline-flex max-w-full items-center gap-1 text-left min-h-[44px] sm:min-h-0 py-1 -my-1`}
        aria-expanded={open}
        aria-label={`Detalhes: ${label}`}
      >
        <span className={`truncate text-[12px] font-medium underline decoration-dotted decoration-ink-muted/50 underline-offset-2 group-hover:decoration-accent/60 ${AXEL_TEXT_PRIMARY}`}>
          {label}
        </span>
        <Info className="w-3 h-3 shrink-0 text-accent/80" aria-hidden />
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-full z-50 mt-1 max-w-[min(280px,calc(100vw-2rem))] rounded-sl border border-line bg-elevated shadow-lg px-3 py-2.5 text-[11px] leading-relaxed text-ink"
        >
          <p className={`font-mono text-[9px] uppercase mb-1 ${AXEL_TEXT_SECONDARY}`}>
            Sobre este valor
          </p>
          <p className="break-words">{note}</p>
        </div>
      )}
    </div>
  )
}
