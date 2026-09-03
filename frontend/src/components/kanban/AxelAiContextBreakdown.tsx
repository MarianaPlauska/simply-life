import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { computeScoreBreakdown } from '../../lib/urgencyScoreBreakdown'
import { urgencyScoreClass } from '../../lib/kanbanVisual'
import { AxelRelevanceScoreInfo } from './AxelRelevanceScoreInfo'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

// Motor de Relevância - score + transparência (influência / semântica / prazo)

interface AxelAiContextBreakdownProps
{
  tarefa: TarefaUnificada
  allTasks?: TarefaUnificada[]
  isCreatingNew?: boolean
  defaultCollapsed?: boolean
}

export function AxelAiContextBreakdown({
  tarefa,
  allTasks,
  isCreatingNew = false,
  defaultCollapsed = true,
}: AxelAiContextBreakdownProps)
{
  const [collapsed, setCollapsed] = useState(defaultCollapsed)
  const breakdown = isCreatingNew
    ? null
    : computeScoreBreakdown(tarefa, allTasks ?? [tarefa])

  return (
    <section className="min-w-0" aria-label="Motor de Relevância">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-2 mb-2 text-left group"
        aria-expanded={!collapsed}
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-ink-muted shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-ink-muted shrink-0" />
        )}
        <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted flex-1">
          Motor de relevância
        </h3>
        {!isCreatingNew && breakdown && (
          <span className={`font-mono text-sm font-bold tabular-nums ${urgencyScoreClass(breakdown.total)}`}>
            {breakdown.total}
          </span>
        )}
      </button>

      {collapsed ? (
        <p className={`text-[11px] pl-5 ${AXEL_TEXT_SECONDARY}`}>
          {isCreatingNew
            ? 'Score calculado após salvar.'
            : breakdown?.reason}
        </p>
      ) : (
        <div className="rounded-sl border border-line bg-chrome/25 p-4 min-w-0 transition-all duration-300">
          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-ink-muted mb-0.5">
                Score final
              </p>
              <div className="flex items-center gap-1">
                <p className={`text-3xl font-mono font-bold tabular-nums leading-none ${isCreatingNew ? 'text-ink-muted' : urgencyScoreClass(breakdown?.total ?? 0)}`}>
                  {isCreatingNew ? '-' : breakdown?.total}
                </p>
                {!isCreatingNew && breakdown && (
                  <AxelRelevanceScoreInfo
                    reason={breakdown.reason}
                    log={breakdown.log}
                  />
                )}
              </div>
            </div>
            {!isCreatingNew && breakdown && (
              <span className="text-[10px] text-ink-muted text-right max-w-[140px] leading-snug">
                40% influência · 40% semântica · 20% prazo
              </span>
            )}
          </div>

          <div className="space-y-3 mb-3">
            {(breakdown?.factors ?? [
              { id: 'influence', label: 'Influência do Remetente', pct: 0, points: 0, maxPoints: 40 },
              { id: 'semantic', label: 'Densidade Semântica', pct: 0, points: 0, maxPoints: 40 },
              { id: 'deadline', label: 'Proximidade do Prazo', pct: 0, points: 0, maxPoints: 20 },
            ]).map((f) => (
              <div key={f.id} className="min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-ink-muted">{f.label}</span>
                  <span className="text-xs font-mono tabular-nums text-ink">
                    {isCreatingNew
                      ? '-'
                      : `${f.points}/${f.maxPoints}`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{
                      width: isCreatingNew
                        ? '0%'
                        : `${Math.min(100, (f.points / f.maxPoints) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className={`text-xs leading-relaxed break-words border-t border-line pt-3 ${AXEL_TEXT_SECONDARY}`}>
            {isCreatingNew
              ? 'O score será calculado após salvar, com base no remetente, termos do título e prazo.'
              : breakdown?.reason}
          </p>
        </div>
      )}
    </section>
  )
}
