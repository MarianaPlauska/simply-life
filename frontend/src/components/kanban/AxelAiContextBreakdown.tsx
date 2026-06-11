import { computeScoreBreakdown } from '../../lib/urgencyScoreBreakdown'
import { AxelRelevanceScoreInfo } from './AxelRelevanceScoreInfo'
import type { TarefaUnificada } from '../../types'

// Motor de Relevância — score + transparência (influência / semântica / prazo)

interface AxelAiContextBreakdownProps
{
  tarefa: TarefaUnificada
  allTasks?: TarefaUnificada[]
  isCreatingNew?: boolean
}

export function AxelAiContextBreakdown({
  tarefa,
  allTasks,
  isCreatingNew = false,
}: AxelAiContextBreakdownProps)
{
  const breakdown = isCreatingNew
    ? null
    : computeScoreBreakdown(tarefa, allTasks ?? [tarefa])

  return (
    <section className="min-w-0" aria-label="Motor de Relevância">
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
        Motor de Relevância
      </h3>

      <div className="rounded-lg border border-indigo-500/10 bg-[#121420] p-4 min-w-0 transition-all duration-300">
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-0.5">
              Score final
            </p>
            <div className="flex items-center gap-1">
              <p className="text-3xl font-mono font-bold tabular-nums text-indigo-300 leading-none">
                {isCreatingNew ? '—' : breakdown?.total}
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
            <span className="text-[10px] text-zinc-500 text-right max-w-[140px] leading-snug">
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
                <span className="text-xs text-zinc-400">{f.label}</span>
                <span className="text-xs font-mono tabular-nums text-zinc-300">
                  {isCreatingNew
                    ? '—'
                    : `${f.points}/${f.maxPoints}`}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-500"
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

        <p className="text-xs text-zinc-400 leading-relaxed break-words border-t border-white/[0.04] pt-3">
          {isCreatingNew
            ? 'O score será calculado após salvar, com base no remetente, termos do título e prazo.'
            : breakdown?.reason}
        </p>
      </div>
    </section>
  )
}
