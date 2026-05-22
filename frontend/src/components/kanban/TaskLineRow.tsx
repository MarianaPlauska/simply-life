import type { CSSProperties, ReactNode } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import type { TarefaUnificada } from '../../types'
import { getOrigin } from '../../constants/kanbanConfig'
import { getUrgencyBadge } from '../../utils/kanbanHelpers'
import { prioStripClass } from '../../utils/prioStripClass'

export interface TaskLineDragProps
{
  setNodeRef?: (node: HTMLElement | null) => void
  listeners?: SyntheticListenerMap
  attributes?: DraggableAttributes
  style?: CSSProperties
  isDragging?: boolean
}

interface TaskLineRowProps
{
  tarefa: TarefaUnificada
  onOpen?: () => void
  drag?: TaskLineDragProps
  trailing?: ReactNode
  className?: string
}

export function TaskLineRow({ tarefa, onOpen, drag, trailing, className }: TaskLineRowProps)
{
  const origin = getOrigin(tarefa.origem || 'manual')
  const urgency = getUrgencyBadge(tarefa.score_urgencia)
  const OriginIcon = origin.Icon
  const subs = tarefa.subtarefas || []
  const subDone = subs.filter((s) => s.concluida).length
  const subTotal = subs.length

  return (
    <article
      ref={drag?.setNodeRef}
      style={drag?.style}
      {...drag?.listeners}
      {...drag?.attributes}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}`}
      className={[
        'group flex items-center gap-2 py-1.5 pl-2 pr-2 rounded-md',
        'border-l-2 bg-transparent hover:bg-zinc-950/80 transition-colors',
        drag ? 'cursor-grab active:cursor-grabbing' : '',
        prioStripClass(tarefa.prioridade),
        drag?.isDragging ? 'opacity-60' : '',
        className ?? '',
      ].join(' ')}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) =>
      {
        if (e.key === 'Enter' || e.key === ' ')
        {
          e.preventDefault()
          onOpen?.()
        }
      }}
    >
      <OriginIcon className={`w-3 h-3 shrink-0 ${origin.color}`} />
      <span className="flex-1 min-w-0 text-[12px] font-medium text-zinc-200 truncate group-hover:text-white">
        {tarefa.titulo}
      </span>
      {tarefa.snippet_100_char && (
        <span className="hidden lg:block max-w-[28%] min-w-0 text-[10px] text-zinc-600 truncate">
          {tarefa.snippet_100_char}
        </span>
      )}
      <span className={`text-[9px] font-mono tabular-nums shrink-0 ${urgency.text}`}>
        {tarefa.score_urgencia ?? 0}
      </span>
      {subTotal > 0 && (
        <span className="text-[9px] text-zinc-600 shrink-0">{subDone}/{subTotal}</span>
      )}
      {trailing}
    </article>
  )
}
