import { CalendarDays, GanttChart, LayoutGrid } from 'lucide-react'
import {
  ORION_FILTER_PILL_ACTIVE,
  ORION_FILTER_PILL_IDLE,
} from '../../constants/orionSurfaces'

export type KanbanViewMode = 'board' | 'list' | 'timeline'

interface KanbanViewSwitcherProps
{
  mode: KanbanViewMode
  onChange: (mode: KanbanViewMode) => void
}

const MODES: { id: KanbanViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'board', label: 'Board', Icon: LayoutGrid },
  { id: 'list', label: 'Lista', Icon: GanttChart },
  { id: 'timeline', label: 'Timeline', Icon: CalendarDays },
]

export function KanbanViewSwitcher({ mode, onChange }: KanbanViewSwitcherProps)
{
  return (
    <div
      className="inline-flex items-center gap-0.5 p-0.5 rounded-sl border border-line bg-chrome"
      role="tablist"
      aria-label="Modo de visualização"
    >
      {MODES.map((m) =>
      {
        const Icon = m.Icon
        const active = mode === m.id
        return (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.id)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sl text-[11px] font-mono transition-colors ${
              active ? ORION_FILTER_PILL_ACTIVE : ORION_FILTER_PILL_IDLE
            }`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            {m.label}
          </button>
        )
      })}
    </div>
  )
}
