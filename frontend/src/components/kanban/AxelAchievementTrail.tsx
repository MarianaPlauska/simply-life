import { Check } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_CHROME_PLANE } from '../../constants/axelSurfaces'
import { cleanTitleForDisplay } from './axelKanbanUtils'

// Rastro de conquistas — faixa inferior editorial

export function AxelAchievementTrail()
{
  const entries = useTaskStore((s) => s.recentAchievements)

  return (
    <section
      className={`shrink-0 border-t border-line ${AXEL_CHROME_PLANE}`}
      aria-label="Concluídas recentemente"
    >
      <div className="px-5 lg:px-7 py-3 max-w-[1680px] mx-auto w-full">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Concluídas recentemente
          </h2>
          <span className="font-mono text-[10px] text-ink-muted tabular-nums">
            {entries.length}
          </span>
        </div>

        {entries.length === 0 ? (
          <p className="font-mono text-[11px] text-ink-muted py-1">
            Suas conquistas aparecem aqui ao concluir demandas.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="achievement-pop-in shrink-0 h-11 min-w-[240px] max-w-[280px] flex items-center gap-2.5 px-3 rounded-sl border border-line bg-card"
                title={cleanTitleForDisplay(entry.titulo)}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sl bg-concluido/10 border border-concluido/25">
                  <Check size={11} strokeWidth={2} className="text-concluido" aria-hidden />
                </span>
                <p className="flex-1 min-w-0 text-[11px] text-ink truncate">
                  {cleanTitleForDisplay(entry.titulo)}
                </p>
                <span className="font-mono text-[10px] tabular-nums text-concluido shrink-0">
                  {entry.focusMinutes}m
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
