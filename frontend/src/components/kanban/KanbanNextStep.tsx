import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import { buildMorningBrief, type MorningBrief } from '../../lib/morningBrief'
import { pickSuggestedExecutionTask } from '../../lib/suggestExecutionTask'
import type { MoodOrchestrationContext } from '../../lib/moodOrchestration'
import { AXEL_BTN_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

interface KanbanNextStepProps
{
  executionQueue: TarefaUnificada[]
  tarefas: TarefaUnificada[]
  heroTask: TarefaUnificada | null
  isExecuting: boolean
  orchestrating: boolean
  dueToday: number
  overdue: number
  dailyScoreCap: number
  mood?: MoodOrchestrationContext | null
  onExecute: () => void
  onOpenTask: (task: TarefaUnificada) => void
  onReorganize: () => void
  onPrioritizeTask: (task: TarefaUnificada) => void
}

export function KanbanNextStep({
  executionQueue,
  tarefas,
  heroTask,
  isExecuting,
  orchestrating,
  dueToday: _dueToday,
  overdue: _overdue,
  dailyScoreCap,
  mood = null,
  onExecute,
  onOpenTask,
  onReorganize,
  onPrioritizeTask,
}: KanbanNextStepProps)
{
  const [brief, setBrief] = useState<MorningBrief>(() =>
    buildMorningBrief(executionQueue, dailyScoreCap, mood),
  )

  useEffect(() =>
  {
    setBrief(buildMorningBrief(executionQueue, dailyScoreCap, mood))
  }, [executionQueue, dailyScoreCap, mood?.capMultiplier, mood?.axelNote])

  const active = useMemo(
    () => tarefas.filter((t) => t.status !== 'concluida'),
    [tarefas],
  )

  const suggested = useMemo(
    () => pickSuggestedExecutionTask(tarefas, heroTask),
    [tarefas, heroTask],
  )

  const queueEmpty = executionQueue.length === 0

  let headline: string

  if (orchestrating && queueEmpty)
  {
    headline = 'Organizando prioridades…'
  }
  else if (queueEmpty && active.length === 0)
  {
    headline = 'Nenhuma demanda ativa'
  }
  else if (queueEmpty)
  {
    headline = 'Escolha o que executar'
  }
  else if (isExecuting)
  {
    headline = 'Sessão em andamento'
  }
  else if (heroTask)
  {
    headline = cleanTitleForDisplay(heroTask.titulo)
  }
  else
  {
    headline = `${executionQueue.length} na fila`
  }

  return (
    <section
      className="flex flex-col sm:flex-row sm:items-center gap-3 px-3 py-2.5 border border-line rounded-sl bg-card"
      aria-label="Próximo passo"
    >
      <div className="flex-1 min-w-0">
        <p className="font-display text-[15px] text-ink leading-snug truncate">
          {headline}
        </p>
        <p className={`text-[11px] mt-0.5 leading-relaxed line-clamp-2 ${AXEL_TEXT_SECONDARY}`}>
          {orchestrating && queueEmpty
            ? 'Aguarde · a fila de execução está sendo montada com seus dados reais.'
            : `${brief.headline}${brief.detail ? ` · ${brief.detail}` : ''}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        {queueEmpty && suggested && (
          <button
            type="button"
            disabled={orchestrating}
            onClick={() => onPrioritizeTask(suggested)}
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 ${AXEL_BTN_PRIMARY}`}
          >
            <ArrowRight size={14} strokeWidth={1.75} />
            Priorizar
          </button>
        )}
        {queueEmpty && active.length > 0 && !suggested && (
          <button
            type="button"
            disabled={orchestrating}
            onClick={onReorganize}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors disabled:opacity-40"
          >
            <Sparkles size={14} strokeWidth={1.75} />
            Organizar
          </button>
        )}
        {!queueEmpty && heroTask && !isExecuting && (
          <button
            type="button"
            onClick={onExecute}
            className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 ${AXEL_BTN_PRIMARY}`}
          >
            <Play size={14} strokeWidth={1.75} />
            Iniciar
          </button>
        )}
        {heroTask && !isExecuting && (
          <button
            type="button"
            onClick={() => onOpenTask(heroTask)}
            className="font-mono text-[10px] uppercase tracking-wide text-ink-muted hover:text-accent px-2 py-2"
          >
            Detalhes
          </button>
        )}
      </div>
    </section>
  )
}
