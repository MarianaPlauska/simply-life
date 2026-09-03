import { useState, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Clock, MoreHorizontal, Pencil, Trash2, Copy, Calendar,
} from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { getOrigin } from '../../constants/kanbanConfig'
import { getElapsed, getUrgencyBadge } from '../../utils/kanbanHelpers'
import {
  kanbanOriginTone,
  KANBAN_ORIGIN_BAR,
} from '../../lib/kanbanCardGrammar'
import { TaskLineRow } from './TaskLineRow'

// KanbanCard - modo "classico" reescrito como card densa de 3 linhas
// Sem sombras, sem avatares falsos, prioridade pela borda esquerda

interface KanbanCardProps
{
  tarefa: TarefaUnificada
  onEdit?: (tarefa: TarefaUnificada) => void
  onDelete?: (id: number) => void
  onDuplicate?: (id: number) => void
  flat?: boolean
}

function DueDateChip({ date }: { date: string })
{
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const venc = new Date(date)
  venc.setHours(0, 0, 0, 0)
  const diff = Math.ceil((venc.getTime() - hoje.getTime()) / 86400000)

  let cor = 'text-zinc-500'
  if (diff < 0) cor = 'text-urgente'
  else if (diff === 0) cor = 'text-amber-400'
  else if (diff <= 2) cor = 'text-orange-400'

  const texto = diff < 0 ? `${Math.abs(diff)}d atraso` : diff === 0 ? 'Hoje' : diff === 1 ? 'Amanhã' : `${diff}d`

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${cor}`}>
      <Calendar className="w-3 h-3" />
      {texto}
    </span>
  )
}

export function KanbanCard({ tarefa, onEdit, onDelete, onDuplicate, flat }: KanbanCardProps)
{
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tarefa.id })
  const [showActions, setShowActions] = useState(false)
  const actionsRef = useRef<HTMLDivElement>(null)

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    transition: isDragging ? 'none' : 'all 200ms cubic-bezier(.4,0,.2,1)',
  }

  // modo linha (Superhuman / temporal) - delega para TaskLineRow
  if (flat)
  {
    return (
      <TaskLineRow
        tarefa={tarefa}
        onOpen={() => onEdit?.(tarefa)}
        drag={{ setNodeRef, listeners, attributes, style, isDragging }}
      />
    )
  }

  const origin = getOrigin(tarefa.origem || 'manual')
  const urgency = getUrgencyBadge(tarefa.score_urgencia)
  const elapsed = getElapsed(tarefa.created_at, tarefa.id)
  const OriginIcon = origin.Icon
  const subs = tarefa.subtarefas || []
  const subDone = subs.filter((s) => s.concluida).length
  const subTotal = subs.length

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}`}
      className={[
        // visual plano: card mas com prioridade pela borda esquerda
        'group relative bg-card border border-zinc-900 rounded-sm',
        'hover:border-violet-500/30 transition-colors cursor-grab active:cursor-grabbing',
        KANBAN_ORIGIN_BAR[kanbanOriginTone(tarefa.origem)],
        isDragging ? 'opacity-60' : '',
      ].join(' ')}
      tabIndex={0}
    >
      {/* linha 1 - origem + score + acoes */}
      <div className="flex items-center gap-2 px-2.5 pt-2 pb-1">
        <OriginIcon className={`w-3.5 h-3.5 shrink-0 ${origin.color}`} />
        <span className="text-[10px] text-zinc-500 font-medium truncate">{origin.label}</span>
        <span className="flex-1" />
        <span className={`text-[11px] font-mono font-semibold tabular-nums ${urgency.text}`}>
          {tarefa.score_urgencia ?? 0}
        </span>
        <div className="relative" ref={actionsRef}>
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions) }}
            className="p-0.5 rounded text-zinc-600 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {showActions && (
            <div
              className="absolute right-0 top-6 z-20 w-32 bg-card border border-zinc-900 rounded py-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(false); onEdit?.(tarefa) }}
                className="flex items-center gap-2 w-full px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900"
              >
                <Pencil className="w-3 h-3" /> Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(false); onDuplicate?.(tarefa.id) }}
                className="flex items-center gap-2 w-full px-2.5 py-1 text-[11px] text-zinc-300 hover:bg-zinc-900"
              >
                <Copy className="w-3 h-3" /> Duplicar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setShowActions(false); onDelete?.(tarefa.id) }}
                className="flex items-center gap-2 w-full px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-3 h-3" /> Arquivar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* linha 2 - titulo (acionavel) */}
      <h4
        className="px-2.5 text-[13px] font-medium text-zinc-100 leading-snug line-clamp-2 cursor-pointer hover:text-violet-300"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit?.(tarefa) }}
      >
        {tarefa.titulo}
      </h4>

      {/* linha 3 - metadados densos (data, sub, elapsed) */}
      <div className="flex items-center gap-3 px-2.5 pt-1 pb-2 text-[10px] text-zinc-500">
        {tarefa.data_vencimento && <DueDateChip date={tarefa.data_vencimento} />}
        {subTotal > 0 && (
          <span className="font-mono tabular-nums">{subDone}/{subTotal}</span>
        )}
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {elapsed}
        </span>
        <span className="flex-1" />
        <span className="font-mono text-zinc-700">#{tarefa.id}</span>
      </div>
    </article>
  )
}
