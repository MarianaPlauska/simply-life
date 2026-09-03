import { getOrigin } from '../../constants/kanbanConfig'
import {
  kanbanOriginTone,
  KANBAN_ORIGIN_DOT,
} from '../../lib/kanbanCardGrammar'

interface KanbanOriginMarkProps
{
  origem: string | null | undefined
}

/** Ponto + rótulo curto da origem - sem pintar o card inteiro */
export function KanbanOriginMark({ origem }: KanbanOriginMarkProps)
{
  const tone = kanbanOriginTone(origem)
  const origin = getOrigin(origem || 'manual')

  return (
    <span className="inline-flex items-center gap-1 min-w-0">
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${KANBAN_ORIGIN_DOT[tone]}`}
        aria-hidden
      />
      <span className="text-[11px] text-ink-muted truncate">
        {origin.label}
      </span>
    </span>
  )
}
