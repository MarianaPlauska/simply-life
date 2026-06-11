import { useId, useState } from 'react'
import { Info } from 'lucide-react'
import type { RelevanceUrgencyLog } from '../../lib/relevanceEngine'

// Transparência do Motor de Relevância — reason + breakdown

interface AxelRelevanceScoreInfoProps
{
  reason: string
  log: RelevanceUrgencyLog
}

export function AxelRelevanceScoreInfo({ reason, log }: AxelRelevanceScoreInfoProps)
{
  const [open, setOpen] = useState(false)
  const panelId = useId()

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        className="p-1 rounded-sl text-ink-muted hover:text-accent hover:bg-accent-muted/30 transition-colors duration-300"
        aria-expanded={open}
        aria-controls={panelId}
        title="Por que este score?"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={16} strokeWidth={1.5} aria-hidden />
      </button>

      {open && (
        <div
          id={panelId}
          role="tooltip"
          className="absolute right-0 top-full mt-2 z-30 w-[min(100vw-2rem,280px)] rounded-sl border border-line bg-card p-3 shadow-xl shadow-black/40 text-left transition-opacity duration-300"
        >
          <p className="text-xs text-ink leading-relaxed mb-2">{reason}</p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] font-mono text-ink-muted">
            <dt>Influência</dt>
            <dd className="text-ink text-right tabular-nums">
              {log.components.influence}/40
            </dd>
            <dt>Semântica</dt>
            <dd className="text-ink text-right tabular-nums">
              {log.components.semantic}/40
            </dd>
            <dt>Prazo</dt>
            <dd className="text-ink text-right tabular-nums">
              {log.components.deadline}/20
            </dd>
          </dl>
          {log.semanticTerms.length > 0 && (
            <p className="text-[10px] text-ink-muted mt-2 pt-2 border-t border-line">
              Termos: {log.semanticTerms.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
