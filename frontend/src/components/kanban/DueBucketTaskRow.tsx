import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Lock, Play } from 'lucide-react'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { isTaskDependencyBlocked } from '../../lib/taskDependencies'
import { ICON } from '../../design/identityTokens'
import { checklistRingClass, urgencyHairlineClass } from '../../lib/kanbanVisual'
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
        'group relative flex items-center gap-2.5 px-1 py-1.5 min-h-12 rounded-sl text-left w-full',
        'hover:bg-chrome/70',
        isExecuting ? 'bg-chrome/50' : '',
        blocked ? 'opacity-45' : 'cursor-grab active:cursor-grabbing',
        isDragging ? 'opacity-50' : '',
      ].join(' ')}
    >
      {score > 70 && (
        <span
          aria-hidden
          className={`absolute left-0 top-2.5 bottom-2.5 w-0.5 rounded-full ${urgencyHairlineClass(score)}`}
        />
      )}

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
        {meta && (
          <p className="text-[12px] text-ink-muted mt-0.5">{meta}</p>
        )}
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
