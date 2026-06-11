import { ArrowRight, CalendarClock, Zap } from 'lucide-react'

// Legenda visual — modelo mental Executar agora vs Prazo

interface KanbanBoardLegendProps
{
  execCount: number
  dueCount: number
}

export function KanbanBoardLegend({ execCount, dueCount }: KanbanBoardLegendProps)
{
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-stretch"
      aria-label="Como ler o planejador"
    >
      <div className="flex items-start gap-3 p-3 rounded-sl border border-accent/30 bg-accent/5">
        <div className="p-2 rounded-sl bg-accent/15 shrink-0">
          <Zap size={16} className="text-accent" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">
            Executar agora
          </p>
          <p className="text-[12px] text-ink mt-1 leading-snug">
            Fila curta do que fazer <strong className="font-medium">neste momento</strong> (máx. 8).
          </p>
          <p className="font-mono text-[11px] tabular-nums text-ink-muted mt-1.5">
            {execCount} na fila
          </p>
        </div>
      </div>

      <div className="hidden sm:flex items-center justify-center px-1 text-ink-muted">
        <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
      </div>

      <div className="flex items-start gap-3 p-3 rounded-sl border border-line bg-chrome/25">
        <div className="p-2 rounded-sl bg-chrome/50 shrink-0">
          <CalendarClock size={16} className="text-ink-muted" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Prazo
          </p>
          <p className="text-[12px] text-ink mt-1 leading-snug">
            Quando a tarefa <strong className="font-medium">precisa estar pronta</strong> — por faixa de data.
          </p>
          <p className="font-mono text-[11px] tabular-nums text-ink-muted mt-1.5">
            {dueCount} com data
          </p>
        </div>
      </div>
    </div>
  )
}
