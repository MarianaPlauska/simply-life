import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface KanbanInsightsPanelProps
{
  summary: string
  children: ReactNode
  defaultOpen?: boolean
}

export function KanbanInsightsPanel({
  summary,
  children,
  defaultOpen = false,
}: KanbanInsightsPanelProps)
{
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[44px] hover:bg-chrome/40 transition-colors text-left"
        aria-expanded={open}
      >
        <span className="text-[13px] font-medium text-ink">
          Mais
        </span>
        <span className="flex items-center gap-2 min-w-0">
          <span className={`text-[12px] truncate ${AXEL_TEXT_SECONDARY}`}>
            {summary}
          </span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-line space-y-3 pt-3">
          {children}
        </div>
      )}
    </section>
  )
}
