import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Archive,
  ArrowUpRight,
  Calendar,
  ListChecks,
  Lock,
  Play,
  Timer,
} from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { getProjectTag } from '../../lib/contextRationale'
import type { LoadBalanceEntry } from '../../lib/adaptiveOrchestration'
import { useSubtaskProgress } from '../../lib/subtaskProgress'
import { formatDueMeta, type TemporalHorizon } from '../../lib/temporalHorizon'
import { isTaskDependencyBlocked } from '../../lib/taskDependencies'
import {
  isThermalDecay,
  resolveDaysStagnant,
  TASK_DECAY_TOOLTIP,
} from '../../lib/taskDecay'
import {
  ORION_KANBAN_CARD,
  ORION_KANBAN_CARD_FOCUS,
  ORION_KANBAN_CARD_HOVER,
  ORION_KANBAN_CARD_INGEST,
} from '../../constants/orionKanbanTheme'
import {
  ORION_PROGRESS,
  ORION_PROGRESS_THICK,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'
import {
  formatTaskRef,
  urgencyDotClass,
  urgencyScoreClass,
  urgencyStripeClass,
} from '../../lib/kanbanVisual'
import { cleanTitleForDisplay } from './orionKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Card Kanban — hierarquia Linear: ref → título → propriedades → ações no hover

interface OrionKanbanCardProps
{
  tarefa: TarefaUnificada
  allTasks: TarefaUnificada[]
  columnHorizon?: TemporalHorizon
  loadBalance?: LoadBalanceEntry
  onOpen?: () => void
  onDemoteToBacklog?: (task: TarefaUnificada) => void
  isDragging?: boolean
  isIngestionHighlight?: boolean
  nobleHourHighlight?: boolean
  featured?: boolean
  queueRank?: number
}

export function OrionKanbanCard({
  tarefa,
  allTasks,
  columnHorizon,
  loadBalance,
  onOpen,
  onDemoteToBacklog,
  isDragging = false,
  isIngestionHighlight = false,
  nobleHourHighlight = false,
  featured = false,
  queueRank,
}: OrionKanbanCardProps)
{
  const resolveLastMovedAt = useTaskStore((s) => s.resolveLastMovedAt)
  const execution = useTaskStore((s) => s.execution)
  const live = useTaskStore((s) => s.tarefas.find((t) => t.id === tarefa.id))
  const serverSubs = live?.subtarefas ?? tarefa.subtarefas
  const { percent, total, done } = useSubtaskProgress(tarefa.id, serverSubs)
  const { startTask } = useStartTaskExecution()

  const taskForRules = live ?? tarefa
  const status = taskForRules.status
  const inProgress = status === 'em_progresso'
  const isTimerHere = execution?.taskId === tarefa.id
  const score = tarefa.score_urgencia ?? 0
  const tag = getProjectTag(tarefa)
  const due = formatDueMeta(tarefa.data_vencimento)
  const lastMoved = resolveLastMovedAt(tarefa.id, tarefa.created_at)
  const daysStagnant = resolveDaysStagnant(taskForRules, lastMoved)
  const dependencyBlocked = isTaskDependencyBlocked(taskForRules, allTasks)
  const snoozed = loadBalance?.snoozed === true
  const thermalDecay =
    !dependencyBlocked && !snoozed && isThermalDecay(columnHorizon, daysStagnant)
  const canStart =
    !dependencyBlocked &&
    !snoozed &&
    status !== 'concluida' &&
    tarefa.id !== 0

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tarefa.id,
    disabled: dependencyBlocked,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const stateRing = isTimerHere
    ? ORION_KANBAN_CARD_FOCUS
    : isIngestionHighlight
      ? ORION_KANBAN_CARD_INGEST
      : nobleHourHighlight
        ? 'ring-1 ring-accent/25'
        : ''

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(dependencyBlocked ? {} : listeners)}
      {...(dependencyBlocked ? {} : attributes)}
      onClick={() => !dependencyBlocked && onOpen?.()}
      onKeyDown={(e) =>
      {
        if (dependencyBlocked) return
        if (e.key === 'Enter' || e.key === ' ')
        {
          e.preventDefault()
          onOpen?.()
        }
      }}
      role="button"
      tabIndex={dependencyBlocked ? -1 : 0}
      aria-disabled={dependencyBlocked}
      className={[
        ORION_KANBAN_CARD,
        ORION_KANBAN_CARD_HOVER,
        urgencyStripeClass(score),
        'group relative flex flex-col text-left w-full',
        dependencyBlocked ? 'opacity-45 pointer-events-none cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        snoozed ? 'opacity-55' : '',
        isDragging ? 'opacity-50 rotate-[0.5deg] shadow-sm scale-[1.02]' : '',
        featured ? 'ring-1 ring-accent/25 bg-card' : '',
        stateRing,
      ].join(' ')}
      title={
        snoozed
          ? loadBalance?.reason
          : thermalDecay
            ? TASK_DECAY_TOOLTIP
            : tarefa.score_reason ?? undefined
      }
    >
      {dependencyBlocked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-fundo/70 rounded-sl">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted bg-card border border-line px-2 py-1 rounded-sl">
            <Lock size={11} strokeWidth={1.5} />
            Bloqueada
          </span>
        </div>
      )}

      {/* Cabeçalho do card */}
      <div className={`flex items-center gap-2 px-3 min-w-0 ${featured ? 'pt-3 pb-1' : 'pt-2.5 pb-1'}`}>
        {queueRank != null && (
          <span className="font-mono text-[10px] text-accent tabular-nums shrink-0">
            {String(queueRank).padStart(2, '0')}
          </span>
        )}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgencyDotClass(score)}`}
          aria-hidden
        />
        <span className={`font-mono text-[9px] uppercase tracking-wider truncate ${ORION_TEXT_SECONDARY}`}>
          {formatTaskRef(tarefa.id)}
        </span>
        <span className={`font-mono text-[9px] uppercase tracking-wider truncate ${ORION_TEXT_SECONDARY}`}>
          · {tag}
        </span>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {inProgress && (
            <span className="font-mono text-[9px] uppercase tracking-wider text-accent">
              {isTimerHere ? 'Foco' : 'Curso'}
            </span>
          )}
          {thermalDecay && (
            <Timer size={11} className="text-urgente" strokeWidth={1.75} aria-hidden />
          )}
          {due && (
            <span className={`inline-flex items-center gap-0.5 font-mono text-[9px] tabular-nums ${ORION_TEXT_SECONDARY}`}>
              <Calendar size={10} strokeWidth={1.5} />
              {due}
            </span>
          )}
        </div>
      </div>

      {/* Título — hierarquia principal */}
      <div className={`px-3 min-w-0 ${featured ? 'pb-2' : 'pb-2'}`}>
        <p className={`font-display leading-snug line-clamp-2 text-ink tracking-[-0.01em] ${featured ? 'text-[15px]' : 'text-[13px]'}`}>
          {cleanTitleForDisplay(tarefa.titulo)}
        </p>
        {featured && (tarefa.urgency_reason ?? tarefa.score_reason) && (
          <p className="text-[11px] text-ink-muted mt-1.5 line-clamp-2 leading-relaxed">
            {tarefa.urgency_reason ?? tarefa.score_reason}
          </p>
        )}
        {snoozed && !dependencyBlocked && (
          <p className={`font-mono text-[9px] mt-1 ${ORION_TEXT_SECONDARY}`}>
            {loadBalance?.reason ?? 'Adiada por carga'}
          </p>
        )}
      </div>

      {/* Propriedades + progresso */}
      <div className="px-3 pb-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 font-mono text-[10px] tabular-nums">
          <span className={urgencyScoreClass(score)}>{score} pts</span>
          {total > 0 && (
            <span className={`inline-flex items-center gap-1 ${ORION_TEXT_SECONDARY}`}>
              <ListChecks size={11} strokeWidth={1.5} />
              {done}/{total}
            </span>
          )}
          {tarefa.intent_category && (
            <span className={`text-[9px] uppercase tracking-wider truncate ${ORION_TEXT_SECONDARY}`}>
              {tarefa.intent_category}
            </span>
          )}
        </div>

        {total > 0 && (
          <div className={`${ORION_PROGRESS_THICK} h-1`}>
            <div
              className={`h-full rounded-sl ${ORION_PROGRESS}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      {/* Ações — reveladas no hover (padrão Linear) */}
      {!dependencyBlocked && (
        <div
          className={[
            'flex items-center gap-1 border-t border-line px-2 py-1.5',
            'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity',
            isTimerHere || featured ? 'opacity-100' : '',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {canStart && !isTimerHere && (
            <button
              type="button"
              onClick={() => void startTask(taskForRules)}
              className="flex-1 inline-flex items-center justify-center gap-1 font-mono text-[9px] uppercase tracking-wide py-1 text-ink-muted hover:text-accent transition-colors"
            >
              <Play size={10} strokeWidth={1.75} fill="currentColor" aria-hidden />
              Iniciar
            </button>
          )}
          {isTimerHere && (
            <span className="flex-1 text-center font-mono text-[9px] uppercase tracking-wide text-accent py-1">
              Em execução
            </span>
          )}
          <button
            type="button"
            onClick={() => onOpen?.()}
            className="inline-flex items-center justify-center p-1 text-ink-muted hover:text-accent transition-colors"
            aria-label="Abrir detalhes"
          >
            <ArrowUpRight size={12} strokeWidth={1.75} />
          </button>
          {thermalDecay && onDemoteToBacklog && (
            <button
              type="button"
              onClick={() => onDemoteToBacklog(taskForRules)}
              className="inline-flex items-center justify-center p-1 text-urgente hover:bg-chrome rounded-sl transition-colors"
              aria-label="Rebaixar para backlog"
            >
              <Archive size={12} strokeWidth={1.75} />
            </button>
          )}
        </div>
      )}
    </article>
  )
}
