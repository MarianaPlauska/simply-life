import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

// Log de decisões do AXEL — transparência na página do Kanban

function formatTime(iso: string): string
{
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function KanbanDecisionLog()
{
  const log = useTaskStore((s) => s.aiDecisionLog)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const [open, setOpen] = useState(log.length > 0)

  if (log.length === 0)
  {
    return null
  }

  return (
    <section className="border border-line rounded-sl bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 hover:bg-chrome/40 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-accent">
          <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
          O que o AXEL decidiu
          <span className={`${AXEL_TEXT_SECONDARY} normal-case`}>
            ({log.length})
          </span>
        </span>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
        )}
      </button>

      {open && (
        <div className="border-t border-line max-h-40 overflow-y-auto custom-scrollbar px-4 py-2 space-y-2">
          {log.slice(0, 12).map((entry) => (
            <div key={entry.id} className="border-l-2 border-accent/35 pl-2.5 py-0.5">
              <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
                {entry.message}
              </p>
              <time className={`font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
                {formatTime(entry.at)}
              </time>
            </div>
          ))}
        </div>
      )}

      <p className={`px-4 py-1.5 border-t border-line font-mono text-[9px] ${AXEL_TEXT_SECONDARY}`}>
        Cap Hoje: {dailyScoreCap} pts · você pode arrastar para ajustar
      </p>
    </section>
  )
}
