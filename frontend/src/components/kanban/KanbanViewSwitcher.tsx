import { CalendarDays, ChartGantt, LayoutGrid, List } from 'lucide-react'
import {
  AXEL_VIEW_SWITCHER_SHELL,
  AXEL_VIEW_TAB_ACTIVE,
  AXEL_VIEW_TAB_IDLE,
} from '../../constants/axelSurfaces'

export type KanbanViewMode = 'board' | 'list' | 'calendar' | 'gantt'

interface KanbanViewSwitcherProps
{
  mode: KanbanViewMode
  onChange: (mode: KanbanViewMode) => void
}

const MODES: { id: KanbanViewMode; label: string; Icon: typeof LayoutGrid; shortLabel?: string }[] = [
  { id: 'board', label: 'Planejador', Icon: LayoutGrid },
  { id: 'list', label: 'Lista', Icon: List },
  { id: 'calendar', label: 'Calendário', Icon: CalendarDays, shortLabel: 'Cal.' },
  { id: 'gantt', label: 'Gantt', Icon: ChartGantt },
]

export function KanbanViewSwitcher({ mode, onChange }: KanbanViewSwitcherProps)
{
  return (
    <div
      className={AXEL_VIEW_SWITCHER_SHELL}
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
            className={active ? AXEL_VIEW_TAB_ACTIVE : AXEL_VIEW_TAB_IDLE}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.shortLabel ?? m.label}</span>
          </button>
        )
      })}
    </div>
  )
}
