import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Lock } from 'lucide-react'
import { DueDateChip } from './DueDateChip'
import { isTaskDependencyBlocked } from '../../lib/taskDependencies'
import { formatTaskRef, urgencyDotClass, urgencyScoreClass } from '../../lib/kanbanVisual'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

interface DueBucketTaskRowProps
{
  tarefa: TarefaUnificada
  allTasks: TarefaUnificada[]
  inExecutionQueue?: boolean
  isDragging?: boolean
  onOpen: () => void
}

export function DueBucketTaskRow({
  tarefa,
  allTasks,
  inExecutionQueue = false,
  isDragging = false,
  onOpen,
}: DueBucketTaskRowProps)
{
  const blocked = isTaskDependencyBlocked(tarefa, allTasks)
  const score = tarefa.score_urgencia ?? 0

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
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
      {...(blocked ? {} : listeners)}
      {...(blocked ? {} : attributes)}
      onClick={() => !blocked && onOpen()}
      onKeyDown={(e) =>
      {
        if (blocked) return
        if (e.key === 'Enter' || e.key === ' ')
        {
          e.preventDefault()
          onOpen()
        }
      }}
      role="button"
      tabIndex={blocked ? -1 : 0}
      className={[
        'group flex items-center gap-2 px-2.5 py-2 rounded-sl border border-line bg-elevated',
        'hover:border-ink-muted/50 hover:bg-card transition-colors text-left w-full',
        blocked ? 'opacity-45 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-50' : '',
        inExecutionQueue ? 'ring-1 ring-accent/30' : '',
      ].join(' ')}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgencyDotClass(score)}`}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug text-ink line-clamp-1">
          {cleanTitleForDisplay(tarefa.titulo)}
        </p>
        <p className="font-mono text-[9px] text-ink-muted mt-0.5 truncate">
          {formatTaskRef(tarefa.id)}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5">
        <DueDateChip date={tarefa.data_vencimento} compact />
        {inExecutionQueue && (
          <span className="font-mono text-[8px] uppercase text-accent border border-accent/25 px-1 rounded-sm">
            Fila
          </span>
        )}
        {blocked ? (
          <Lock size={12} className="text-ink-muted" aria-label="Bloqueada" />
        ) : (
          <span className={`font-mono text-[10px] tabular-nums ${urgencyScoreClass(score)}`}>
            {score}
          </span>
        )}
      </div>
    </article>
  )
}
