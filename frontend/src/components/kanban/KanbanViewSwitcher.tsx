import { CalendarDays, ChartGantt, LayoutGrid, List } from 'lucide-react'
import { ICON } from '../../design/identityTokens'

export type KanbanViewMode = 'board' | 'list' | 'calendar' | 'gantt'

interface KanbanViewSwitcherProps
{
  mode: KanbanViewMode
  onChange: (mode: KanbanViewMode) => void
}

const MODES: { id: KanbanViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'board', label: 'Quadro', Icon: LayoutGrid },
  { id: 'list', label: 'Lista', Icon: List },
  { id: 'calendar', label: 'Calendário', Icon: CalendarDays },
  { id: 'gantt', label: 'Gantt', Icon: ChartGantt },
]

export function KanbanViewSwitcher({ mode, onChange }: KanbanViewSwitcherProps)
{
  return (
    <div
      className="inline-flex items-center gap-0.5 shrink-0"
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
            aria-label={m.label}
            title={m.label}
            onClick={() => onChange(m.id)}
            className={`inline-flex items-center justify-center w-10 h-10 rounded-sl transition-colors ${
              active
                ? 'text-ink bg-elevated'
                : 'text-ink-muted hover:text-ink hover:bg-elevated/60'
            }`}
          >
            <Icon size={ICON.sizeNav} strokeWidth={ICON.stroke} />
          </button>
        )
      })}
    </div>
  )
}
