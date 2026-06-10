import { Play, Sparkles, Target } from 'lucide-react'
import type { EnergyPeriod } from '../../lib/energyOrchestration'
import { formatTaskRef, urgencyScoreClass } from '../../lib/kanbanVisual'
import { getProjectTag } from '../../lib/contextRationale'
import { ZenFocusProgressRing } from './ZenFocusProgressRing'
import { ORION_BTN_PRIMARY } from '../../constants/orionSurfaces'
import { cleanTitleForDisplay } from './orionKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Bloco “Executar agora” — gancho de uso diário (por que esta tarefa, CTA claro)

const PERIOD_LABEL: Record<EnergyPeriod, string> = {
  manha: 'Manhã — pico cognitivo',
  tarde: 'Tarde — execução',
  noite: 'Noite — manutenção',
}

interface KanbanExecutionHeroProps
{
  task: TarefaUnificada | null
  energyPeriod: EnergyPeriod
  nobleHour: boolean
  doneToday: number
  activeToday: number
  loadPercent: number
  isExecuting: boolean
  onExecute: () => void
  onOpen: () => void
  onAbsoluteFocus: () => void
}

export function KanbanExecutionHero({
  task,
  energyPeriod,
  nobleHour,
  doneToday,
  activeToday,
  loadPercent,
  isExecuting,
  onExecute,
  onOpen,
  onAbsoluteFocus,
}: KanbanExecutionHeroProps)
{
  const totalToday = doneToday + activeToday
  const dayProgress = totalToday > 0 ? doneToday / totalToday : 0
  const score = task?.score_urgencia ?? 0
  const reason =
    task?.urgency_reason
    ?? task?.score_reason
    ?? (task ? 'Prioridade calculada pelo motor Orion.' : null)

  return (
    <section
      className="border border-line rounded-sl bg-card overflow-hidden border-l-[4px] border-l-accent"
      aria-label="Próxima execução"
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 p-4 lg:p-5 min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
            <p className="sl-eyebrow">Execução agora</p>
            <span className="font-mono text-[10px] text-ink-muted uppercase tracking-wide">
              {PERIOD_LABEL[energyPeriod]}
            </span>
            {nobleHour && task && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide text-accent border border-accent/30 bg-accent-muted px-2 py-0.5 rounded-sl">
                <Sparkles size={10} strokeWidth={1.75} />
                Horário nobre
              </span>
            )}
          </div>

          {!task ? (
            <div className="py-4">
              <p className="font-display text-xl text-ink tracking-tight">
                Nada em execução imediata
              </p>
              <p className="font-mono text-[12px] text-ink-muted mt-2 max-w-lg">
                Arraste uma demanda para Hoje ou use Nova demanda. O Orion ordena por score e contexto.
              </p>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              <ZenFocusProgressRing progress={dayProgress} size={72}>
                <span className={`font-display text-lg tabular-nums leading-none ${urgencyScoreClass(score)}`}>
                  {score}
                </span>
              </ZenFocusProgressRing>

              <div className="flex-1 min-w-0">
                <p className="font-display text-xl sm:text-2xl text-ink tracking-tight leading-snug line-clamp-2">
                  {cleanTitleForDisplay(task.titulo)}
                </p>
                <p className="font-mono text-[11px] text-ink-muted mt-2 flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>{formatTaskRef(task.id)}</span>
                  <span>·</span>
                  <span>{getProjectTag(task)}</span>
                  <span>·</span>
                  <span className={urgencyScoreClass(score)}>{score} pts</span>
                </p>
                {reason && (
                  <p className="text-[13px] text-ink-muted mt-3 leading-relaxed line-clamp-2 border-l-2 border-line pl-3">
                    {reason}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-line">
            {task && (
              <>
                <button
                  type="button"
                  onClick={onExecute}
                  disabled={isExecuting}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-wide ${ORION_BTN_PRIMARY}`}
                >
                  <Play size={14} strokeWidth={1.75} fill="currentColor" />
                  {isExecuting ? 'Em execução' : 'Executar agora'}
                </button>
                <button
                  type="button"
                  onClick={onOpen}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors"
                >
                  Abrir detalhes
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onAbsoluteFocus}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors ml-auto"
            >
              <Target size={13} strokeWidth={1.75} />
              Foco absoluto
            </button>
          </div>
        </div>

        <aside className="lg:w-[200px] shrink-0 border-t lg:border-t-0 lg:border-l border-line bg-chrome/40 px-4 py-4 flex flex-row lg:flex-col justify-around lg:justify-center gap-4">
          <StatBlock label="Concluídas hoje" value={String(doneToday)} />
          <StatBlock label="Na fila" value={String(activeToday)} />
          <StatBlock
            label="Carga"
            value={`${loadPercent}%`}
            variant={loadPercent >= 100 ? 'urgent' : loadPercent >= 80 ? 'warn' : 'default'}
          />
        </aside>
      </div>
    </section>
  )
}

function StatBlock({
  label,
  value,
  variant = 'default',
}: {
  label: string
  value: string
  variant?: 'default' | 'warn' | 'urgent'
})
{
  const valueClass =
    variant === 'urgent'
      ? 'text-urgente'
      : variant === 'warn'
        ? 'text-atencao'
        : 'text-ink'

  return (
    <div className="text-center lg:text-left">
      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-muted">{label}</p>
      <p className={`font-display text-2xl tabular-nums leading-none mt-1 ${valueClass}`}>
        {value}
      </p>
    </div>
  )
}
