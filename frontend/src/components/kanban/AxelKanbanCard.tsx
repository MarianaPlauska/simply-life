import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Check, Lock, Play } from 'lucide-react'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { useTaskStore } from '../../store/useTaskStore'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import type { LoadBalanceEntry } from '../../lib/adaptiveOrchestration'
import { formatDueMeta, type TemporalHorizon } from '../../lib/temporalHorizon'
import { isTaskDependencyBlocked } from '../../lib/taskDependencies'
import { isThermalDecay, resolveDaysStagnant } from '../../lib/taskDecay'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { ICON } from '../../design/identityTokens'
import { checklistRingClass, urgencyHairlineClass } from '../../lib/kanbanVisual'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

type KanbanCardLayout = 'checklist' | 'quiet'

interface AxelKanbanCardProps
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
  inExecutionQueue?: boolean
  layout?: KanbanCardLayout
}

export function AxelKanbanCard({
  tarefa,
  allTasks,
  columnHorizon,
  loadBalance,
  onOpen,
  isDragging = false,
  featured = false,
  layout = 'checklist',
}: AxelKanbanCardProps)
{
  const resolveLastMovedAt = useTaskStore((s) => s.resolveLastMovedAt)
  const execution = useTaskStore((s) => s.execution)
  const live = useTaskStore((s) => s.tarefas.find((t) => t.id === tarefa.id))
  const { startTask } = useStartTaskExecution()

  const taskForRules = live ?? tarefa
  const status = taskForRules.status
  const isTimerHere = execution?.taskId === tarefa.id
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
  const score = tarefa.score_urgencia ?? 0
  const checklist = layout === 'checklist'

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tarefa.id,
    disabled: dependencyBlocked,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const meta = due
    ?? (isTimerHere ? 'Foco' : snoozed ? 'Adiada' : thermalDecay ? 'Parada' : null)

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
        'group relative flex items-center gap-2.5 w-full text-left min-h-12 py-1.5 px-2 rounded-sl',
        'border-[0.5px] border-line hover:border-ink-muted/40',
        featured || isTimerHere ? 'bg-chrome/50' : '',
        dependencyBlocked ? 'opacity-45 pointer-events-none cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        snoozed ? 'opacity-55' : '',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
      title={snoozed ? loadBalance?.reason : tarefa.score_reason ?? undefined}
    >
      {dependencyBlocked && (
        <span className="absolute inset-0 z-20 flex items-center justify-center gap-1 text-[12px] text-ink-muted">
          <Lock size={ICON.sizeInline} strokeWidth={ICON.stroke} />
          Bloqueada
        </span>
      )}

      {score > 70 && (
        <span
          aria-hidden
          className={`absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full ${urgencyHairlineClass(score)}`}
        />
      )}

      {checklist && (
        <button
          type="button"
          disabled={status === 'concluida' || tarefa.id === 0}
          onClick={(e) =>
          {
            e.stopPropagation()
            void axelCompleteTask(taskForRules)
          }}
          className={`
            shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
            ${checklistRingClass(score, status === 'concluida')}
          `}
          aria-label="Concluir tarefa"
        >
          {status === 'concluida' && <Check size={14} strokeWidth={2.5} />}
        </button>
      )}

      <span className="min-w-0 flex-1">
        <span className="block font-sans font-medium leading-snug line-clamp-2 text-ink text-[14px]">
          {cleanTitleForDisplay(tarefa.titulo)}
        </span>
        {meta && (
          <span className={`block text-[12px] mt-0.5 tabular-nums ${AXEL_TEXT_SECONDARY}`}>
            {meta}
          </span>
        )}
      </span>

      {canStart && !isTimerHere && (
        <button
          type="button"
          onClick={(e) =>
          {
            e.stopPropagation()
            void startTask(taskForRules)
          }}
          className={`
            shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-sl text-ink-muted hover:text-ink
            ${checklist ? 'opacity-100 md:opacity-0 md:group-hover:opacity-100' : 'opacity-0 md:group-hover:opacity-100'}
          `}
          aria-label="Executar"
        >
          <Play size={14} strokeWidth={ICON.stroke} fill="currentColor" />
        </button>
      )}
    </article>
  )
}
