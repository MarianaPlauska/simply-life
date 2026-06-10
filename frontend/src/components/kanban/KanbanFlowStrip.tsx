import { ArrowRight } from 'lucide-react'
import type { TemporalHorizon } from '../../lib/temporalHorizon'

// Indicador de fluxo temporal — reforça o modelo mental único do produto

const STEPS: { id: TemporalHorizon; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'semana', label: 'Semana' },
  { id: 'backlog', label: 'Backlog' },
]

interface KanbanFlowStripProps
{
  counts: Record<TemporalHorizon, number>
}

export function KanbanFlowStrip({ counts }: KanbanFlowStripProps)
{
  return (
    <div
      className="flex flex-wrap items-center gap-1 sm:gap-2 py-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted"
      aria-hidden
    >
      {STEPS.map((step, i) => (
        <span key={step.id} className="inline-flex items-center gap-1 sm:gap-2">
          {i > 0 && (
            <ArrowRight className="w-3 h-3 text-line hidden sm:block" strokeWidth={1.5} />
          )}
          <span className={step.id === 'hoje' ? 'text-accent' : ''}>
            {step.label}
          </span>
          <span className="tabular-nums text-ink-muted/80">({counts[step.id]})</span>
        </span>
      ))}
    </div>
  )
}
