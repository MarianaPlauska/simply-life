import { ArrowRight, Play, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import { bucketByDueDate } from '../../lib/dueBucket'
import { pickSuggestedExecutionTask } from '../../lib/suggestExecutionTask'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

interface KanbanNextStepProps
{
  executionQueue: TarefaUnificada[]
  tarefas: TarefaUnificada[]
  heroTask: TarefaUnificada | null
  isExecuting: boolean
  orchestrating: boolean
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
  onExecute,
  onOpenTask,
  onReorganize,
  onPrioritizeTask,
}: KanbanNextStepProps)
{
  const active = useMemo(
    () => tarefas.filter((t) => t.status !== 'concluida'),
    [tarefas],
  )

  const suggested = useMemo(
    () => pickSuggestedExecutionTask(tarefas, heroTask),
    [tarefas, heroTask],
  )

  const dueBuckets = useMemo(() => bucketByDueDate(tarefas), [tarefas])
  const dueToday = dueBuckets.hoje.length
  const dueWeek = dueBuckets.esta_semana.length
  const noDate = dueBuckets.sem_prazo.length
  const overdue = dueBuckets.vencido.length

  const queueEmpty = executionQueue.length === 0

  let headline: string

  if (queueEmpty && active.length === 0)
  {
    headline = 'Nenhuma demanda ativa'
  }
  else if (queueEmpty)
  {
    headline = 'Escolha o que executar agora'
  }
  else if (isExecuting)
  {
    headline = 'Sessão em andamento'
  }
  else
  {
    headline = `${executionQueue.length} na fila de execução`
  }

  return (
    <section
      className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 px-4 py-3 border border-line rounded-sl bg-card"
      aria-label="Próximo passo"
    >
      <div className="flex-1 min-w-0">
        <p className="font-display text-[15px] sm:text-[16px] text-ink leading-snug">
          {headline}
        </p>

        <div className="flex flex-wrap gap-1.5 mt-2">
          {overdue > 0 && (
            <span className="font-mono text-[10px] tabular-nums px-2 py-1 rounded-sl border border-urgente/40 bg-urgente/10 text-urgente">
              Atrasadas {overdue}
            </span>
          )}
          <span className={`font-mono text-[10px] tabular-nums px-2 py-1 rounded-sl border ${dueToday > 0 ? 'border-atencao/40 bg-atencao/10 text-atencao' : 'border-line bg-chrome/20 text-ink-muted'}`}>
            Prazo hoje {dueToday}
          </span>
          <span className={`font-mono text-[10px] tabular-nums px-2 py-1 rounded-sl border ${dueWeek > 0 ? 'border-accent/30 bg-accent-muted/30 text-accent' : 'border-line bg-chrome/20 text-ink-muted'}`}>
            Esta semana {dueWeek}
          </span>
          <span className="font-mono text-[10px] tabular-nums px-2 py-1 rounded-sl border border-line bg-chrome/20 text-ink-muted">
            Sem data {noDate}
          </span>
        </div>

        <p className="text-[12px] text-ink-muted mt-2 leading-relaxed">
          {queueEmpty && dueToday > 0 && (
            <>Você tem <strong className="text-ink font-medium">{dueToday}</strong> com prazo hoje — arraste uma para <strong className="text-ink font-medium">Executar agora</strong> ou use Priorizar.</>
          )}
          {queueEmpty && dueToday === 0 && active.length > 0 && (
            <>Nenhuma com prazo hoje. Priorize pela sugestão ou deixe o AXEL montar a fila.</>
          )}
          {queueEmpty && active.length === 0 && (
            <>Capture uma tarefa ou aguarde ingestão do AXEL.</>
          )}
          {!queueEmpty && isExecuting && (
            <>Conclua ou pause antes de trocar de foco.</>
          )}
          {!queueEmpty && !isExecuting && (
            <>Selecione uma tarefa à esquerda e pressione Iniciar.</>
          )}
        </p>

        {suggested && queueEmpty && (
          <button
            type="button"
            onClick={() => onOpenTask(suggested)}
            className="mt-3 w-full sm:w-auto text-left px-3 py-2 rounded-sl border border-line bg-elevated hover:border-accent/40 transition-colors"
          >
            <span className="font-mono text-[10px] uppercase tracking-wide text-accent block mb-1">
              Próxima sugerida
            </span>
            <span className="text-[13px] text-ink line-clamp-2">
              {cleanTitleForDisplay(suggested.titulo)}
            </span>
            <span className="font-mono text-[10px] text-ink-muted mt-1 block tabular-nums">
              {suggested.score_urgencia ?? 0} pts
            </span>
          </button>
        )}
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
        {queueEmpty && active.length > 0 && (
          <button
            type="button"
            disabled={orchestrating}
            onClick={onReorganize}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors disabled:opacity-40"
          >
            <Sparkles size={14} strokeWidth={1.75} />
            AXEL organizar
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
      </div>
    </section>
  )
}
