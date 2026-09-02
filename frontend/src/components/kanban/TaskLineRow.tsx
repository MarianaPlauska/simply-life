import type { CSSProperties, ReactNode } from 'react'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'
import { Sparkles, Bot } from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { getOrigin } from '../../constants/kanbanConfig'
import { getUrgencyBadge } from '../../utils/kanbanHelpers'
import {
  kanbanOriginTone,
  KANBAN_ORIGIN_BAR,
  kanbanDueTextClass,
} from '../../lib/kanbanCardGrammar'

// Linha de tarefa — "tudo é linha" com micro-estética (metadados à direita, IA-aware)

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
  dense?: boolean
  borderless?: boolean
  ultraCompact?: boolean
  /** Metadados ricos à direita — dashboard executivo */
  rich?: boolean
}

function originChip(origem: string): string
{
  if (origem.includes('github')) return 'GitHub'
  if (origem.includes('webhook')) return 'API'
  if (origem.includes('gmail') || origem === 'email') return 'E-mail'
  if (origem === 'meeting' || origem === 'google_cal') return 'Cal'
  if (origem === 'financeiro') return 'Fin'
  if (origem === 'saude') return 'Saúde'
  return 'Manual'
}

function estimateDuration(score: number): string
{
  if (score >= 120) return '45m'
  if (score >= 100) return '30m'
  if (score >= 60) return '15m'
  return '10m'
}

const IA_ORIGINS = new Set(['webhook', 'gmail_triage', 'gmail_api', 'gmail_mock', 'gmail'])

export function TaskLineRow({
  tarefa,
  onOpen,
  drag,
  trailing,
  className,
  dense = false,
  borderless = false,
  ultraCompact = false,
  rich = false,
}: TaskLineRowProps)
{
  const origin = getOrigin(tarefa.origem || 'manual')
  const urgency = getUrgencyBadge(tarefa.score_urgencia)
  const OriginIcon = origin.Icon
  const subs = tarefa.subtarefas || []
  const subDone = subs.filter((s) => s.concluida).length
  const subTotal = subs.length
  const score = tarefa.score_urgencia ?? 0
  const isIa = IA_ORIGINS.has(tarefa.origem || '')

  const hora = (() =>
  {
    if (!tarefa.data_vencimento) return null
    const d = new Date(tarefa.data_vencimento)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })()

  const handleKey = (e: React.KeyboardEvent) =>
  {
    if (e.key === 'Enter' || e.key === ' ')
    {
      e.preventDefault()
      onOpen?.()
    }
  }

  const rowPad = rich
    ? 'min-h-[44px] py-3 pl-1 pr-2 gap-3 hover:bg-white/[0.03] border-b border-white/5 last:border-b-0'
    : ultraCompact
      ? 'min-h-[44px] py-3 pl-2 pr-2 gap-2 hover:bg-white/[0.03] border-b border-white/5 last:border-b-0'
      : dense
        ? borderless
          ? 'min-h-[44px] py-3 pl-2 pr-2 gap-2.5 hover:bg-white/[0.03] border-b border-white/5 last:border-b-0'
          : 'min-h-[44px] py-3 px-3 border-b border-white/5 last:border-b-0 hover:bg-white/[0.03]'
        : 'min-h-[44px] py-3 pl-2.5 pr-2 hover:bg-white/[0.03] border-b border-white/5 last:border-b-0'

  return (
    <article
      ref={drag?.setNodeRef}
      style={drag?.style}
      {...drag?.listeners}
      {...drag?.attributes}
      role="listitem"
      aria-label={`Tarefa: ${tarefa.titulo}`}
      className={[
        'group flex items-center transition-colors tracking-tight min-w-0 overflow-hidden',
        rich ? '' : ultraCompact ? '' : dense ? borderless ? '' : '' : '',
        rowPad,
        drag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        KANBAN_ORIGIN_BAR[kanbanOriginTone(tarefa.origem)],
        drag?.isDragging ? 'opacity-60' : '',
        className ?? '',
      ].join(' ')}
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKey}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!rich && hora && (
          <>
            <span className={`font-mono tabular-nums shrink-0 ${kanbanDueTextClass(tarefa.data_vencimento)} ${
              ultraCompact ? 'text-[10px] w-8' : 'text-[11px] w-10 text-zinc-400'
            }`}>{hora}</span>
            {!ultraCompact && <span className="text-zinc-700 shrink-0">─</span>}
          </>
        )}
        {!rich && (
          <OriginIcon className={`shrink-0 opacity-40 ${origin.color} ${
            ultraCompact ? 'w-2.5 h-2.5' : 'w-3 h-3'
          }`} />
        )}
        <span
          className={`min-w-0 flex-1 font-medium truncate group-hover:opacity-90 text-[13px] ${rich ? '' : ultraCompact ? 'text-[12px]' : 'text-[13px]'} text-zinc-800 dark:text-zinc-200`}
          title={tarefa.titulo}
        >
          {tarefa.titulo}
        </span>
      </div>

      {rich ? (
        <div className="flex items-center justify-end gap-2 shrink-0 ml-2 max-w-[45%] sm:max-w-[50%]">
          {hora && (
            <span className={`text-xs font-mono tabular-nums hidden sm:inline ${kanbanDueTextClass(tarefa.data_vencimento)}`}>
              {hora}
            </span>
          )}
          <span className="text-xs text-zinc-500 tabular-nums">
            [{estimateDuration(score)}]
          </span>
          <span className="text-xs text-zinc-500 hidden md:inline">
            {originChip(tarefa.origem || 'manual')}
          </span>
          {isIa ? (
            <span className="inline-flex items-center gap-0.5 text-zinc-500" title="Triagem IA">
              <Bot className="w-3 h-3 opacity-60" />
              <Sparkles className="w-2.5 h-2.5 opacity-40" />
            </span>
          ) : (
            <OriginIcon className={`w-3 h-3 opacity-50 ${origin.color}`} />
          )}
          <span className={`text-xs font-mono font-medium tabular-nums ${urgency.text}`}>
            {score}
          </span>
          {subTotal > 0 && (
            <span className="text-[10px] text-zinc-600 tabular-nums">{subDone}/{subTotal}</span>
          )}
        </div>
      ) : (
        <>
          {!ultraCompact && tarefa.snippet_100_char && (
            <span className="hidden lg:block max-w-[24%] min-w-0 text-[11px] text-zinc-500 truncate">
              {tarefa.snippet_100_char}
            </span>
          )}
          <span className={`font-mono font-medium tabular-nums shrink-0 text-zinc-500 ${
            ultraCompact ? 'text-[10px]' : `text-[11px] font-semibold ${urgency.text}`
          }`}>
            {score}
          </span>
          {subTotal > 0 && (
            <span className="text-[10px] text-zinc-500 shrink-0">{subDone}/{subTotal}</span>
          )}
          {dense && !trailing && !ultraCompact && (
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <kbd className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-mono text-zinc-600">↵</kbd>
              <kbd className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 px-1 text-[10px] font-mono text-zinc-600">O</kbd>
            </div>
          )}
        </>
      )}

      {trailing}
    </article>
  )
}
