import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Lock, Play } from 'lucide-react'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { isTaskDependencyBlocked } from '../../lib/taskDependencies'
import { ICON } from '../../design/identityTokens'
import { checklistRingClass } from '../../lib/kanbanVisual'
import {
  kanbanOriginTone,
  KANBAN_ORIGIN_BAR,
  kanbanDueTextClass,
  kanbanDueLabel,
} from '../../lib/kanbanCardGrammar'
import { KanbanOriginMark } from './KanbanOriginMark'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

interface DueBucketTaskRowProps
{
  tarefa: TarefaUnificada
  allTasks: TarefaUnificada[]
  inExecutionQueue?: boolean
  isExecuting?: boolean
  isDragging?: boolean
  onOpen: () => void
  onStartExecute?: (task: TarefaUnificada) => void
}

export function DueBucketTaskRow({
  tarefa,
  allTasks,
  inExecutionQueue = false,
  isExecuting = false,
  isDragging = false,
  onOpen,
  onStartExecute,
}: DueBucketTaskRowProps)
{
  const blocked = isTaskDependencyBlocked(tarefa, allTasks)
  const canExecute = !blocked && tarefa.status !== 'concluida' && tarefa.id !== 0
  const score = tarefa.score_urgencia ?? 0
  const tone = kanbanOriginTone(tarefa.origem)
  const dueLabel = kanbanDueLabel(tarefa.data_vencimento)

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: tarefa.id,
    disabled: blocked,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const meta = isExecuting ? 'Foco' : inExecutionQueue ? 'Na fila' : null

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...(blocked ? {} : listeners)}
      {...(blocked ? {} : attributes)}
      className={[
        'group relative flex items-center gap-2.5 pl-2.5 pr-1 py-1.5 min-h-12 rounded-sl text-left w-full',
        'hover:bg-chrome/70',
        KANBAN_ORIGIN_BAR[tone],
        isExecuting ? 'bg-chrome/50' : '',
        blocked ? 'opacity-45' : 'cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
    >

      {canExecute ? (
        <button
          type="button"
          onClick={(e) =>
          {
            e.stopPropagation()
            void axelCompleteTask(tarefa)
          }}
          className={`shrink-0 w-6 h-6 rounded-full border-2 ${checklistRingClass(score)}`}
          aria-label="Concluir tarefa"
        />
      ) : (
        <span className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-muted">
          <Lock size={ICON.sizeInline} strokeWidth={ICON.stroke} aria-label="Bloqueada" />
        </span>
      )}

      <button
        type="button"
        onClick={() => !blocked && onOpen()}
        disabled={blocked}
        className="flex-1 min-w-0 text-left"
      >
        <p className="text-[14px] font-medium leading-snug line-clamp-1 text-ink">
          {cleanTitleForDisplay(tarefa.titulo)}
        </p>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <KanbanOriginMark origem={tarefa.origem} />
          {dueLabel && (
            <span className={`text-[12px] tabular-nums shrink-0 ${kanbanDueTextClass(tarefa.data_vencimento)}`}>
              {dueLabel}
            </span>
          )}
          {meta && (
            <span className="text-[12px] text-ink-muted truncate">{meta}</span>
          )}
        </div>
      </button>

      {canExecute && onStartExecute && !isExecuting && (
        <button
          type="button"
          onClick={(e) =>
          {
            e.stopPropagation()
            onStartExecute(tarefa)
          }}
          className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-sl text-ink-muted hover:text-ink"
          aria-label="Executar agora"
        >
          <Play size={14} strokeWidth={ICON.stroke} fill="currentColor" />
        </button>
      )}
    </article>
  )
}
