import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Lock, Play } from 'lucide-react'
import { DueDateChip } from './DueDateChip'
import { isTaskDependencyBlocked } from '../../lib/taskDependencies'
import { formatTaskRef } from '../../lib/kanbanVisual'
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

  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform } = useDraggable({
    id: tarefa.id,
    disabled: blocked,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={[
        'group flex items-center gap-1.5 px-2 py-2 rounded-sl border text-left w-full transition-colors',
        isExecuting
          ? 'border-accent bg-accent/15 ring-1 ring-accent/40 shadow-sm'
          : inExecutionQueue
            ? 'border-accent/35 bg-accent/8'
            : 'border-line bg-elevated hover:border-ink-muted/50 hover:bg-card',
        blocked ? 'opacity-45' : '',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
    >
      {!blocked && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 p-1 -ml-0.5 rounded-sl text-ink-muted hover:text-ink cursor-grab active:cursor-grabbing touch-none"
          aria-label="Arrastar tarefa"
        >
          <GripVertical size={14} strokeWidth={1.75} />
        </button>
      )}

      <button
        type="button"
        onClick={() => !blocked && onOpen()}
        disabled={blocked}
        className="flex-1 min-w-0 flex items-center gap-2 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-snug line-clamp-1 ${isExecuting ? 'text-accent font-medium' : 'text-ink'}`}>
            {cleanTitleForDisplay(tarefa.titulo)}
          </p>
          <p className="font-mono text-[9px] text-ink-muted mt-0.5 truncate">
            {formatTaskRef(tarefa.id)}
            {isExecuting && (
              <span className="text-accent ml-1.5 uppercase">· em foco</span>
            )}
            {!isExecuting && inExecutionQueue && (
              <span className="text-accent/80 ml-1.5 uppercase">· na fila</span>
            )}
          </p>
        </div>
      </button>

      <div className="shrink-0 flex items-center gap-1">
        {canExecute && onStartExecute && !isExecuting && (
          <button
            type="button"
            onClick={(e) =>
            {
              e.stopPropagation()
              onStartExecute(tarefa)
            }}
            className="inline-flex items-center justify-center w-8 h-8 rounded-sl border border-accent/35 bg-accent/10 text-accent hover:bg-accent/20 transition-colors shrink-0"
            aria-label="Executar agora"
            title="Executar agora"
          >
            <Play size={14} strokeWidth={1.75} fill="currentColor" />
          </button>
        )}
        <DueDateChip date={tarefa.data_vencimento} compact />
        {blocked && (
          <Lock size={12} className="text-ink-muted" aria-label="Bloqueada" />
        )}
      </div>
    </article>
  )
}
