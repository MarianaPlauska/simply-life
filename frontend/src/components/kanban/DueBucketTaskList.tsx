import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TarefaUnificada } from '../../types'

// Lista de prazo com teto visual — evita seção gigante com muitas tarefas

interface DueBucketTaskListProps
{
  items: TarefaUnificada[]
  maxVisible?: number
  renderItem: (t: TarefaUnificada) => React.ReactNode
}

export function DueBucketTaskList({
  items,
  maxVisible = 6,
  renderItem,
}: DueBucketTaskListProps)
{
  const [expanded, setExpanded] = useState(false)
  const hidden = Math.max(0, items.length - maxVisible)
  const visible = expanded ? items : items.slice(0, maxVisible)
  const needsClamp = hidden > 0 && !expanded

  return (
    <div className="space-y-1.5">
      <div className={needsClamp ? 'relative' : ''}>
        <div className="space-y-1.5">
          {visible.map((t) => renderItem(t))}
        </div>
        {needsClamp && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card to-transparent"
            aria-hidden
          />
        )}
      </div>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-1 py-1.5 font-mono text-[10px] uppercase tracking-wide text-accent hover:bg-chrome/40 rounded-sl border border-line transition-colors"
        >
          <ChevronDown size={12} />
          Ver mais {hidden} nesta faixa
        </button>
      )}
    </div>
  )
}
