import { useRef, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { AXEL_KANBAN_WORKSPACE } from '../../constants/axelKanbanTheme'
import {
  AXEL_BTN_PRIMARY,
  AXEL_FILTER_PILL_ACTIVE,
  AXEL_FILTER_PILL_IDLE,
} from '../../constants/axelSurfaces'

export type MobileBoardTab = 'executar' | 'prazo'

interface KanbanMobileBoardShellProps
{
  executar: ReactNode
  prazo: ReactNode
  execCount: number
  dueCount: number
  tab: MobileBoardTab
  onTabChange: (tab: MobileBoardTab) => void
  onAddTask?: () => void
}

const SWIPE_THRESHOLD_PX = 48

export function KanbanMobileBoardShell({
  executar,
  prazo,
  execCount,
  dueCount,
  tab,
  onTabChange,
  onAddTask,
}: KanbanMobileBoardShellProps)
{
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) =>
  {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }

  const handleTouchEnd = (e: React.TouchEvent) =>
  {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return

    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    const dy = t.clientY - start.y

    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return

    if (dx < 0 && tab === 'executar')
    {
      onTabChange('prazo')
    }
    else if (dx > 0 && tab === 'prazo')
    {
      onTabChange('executar')
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      <div
        className="lg:hidden shrink-0 flex border border-line rounded-sl overflow-hidden mb-2"
        role="tablist"
        aria-label="Painel do planejador"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'executar'}
          onClick={() => onTabChange('executar')}
          className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
            tab === 'executar' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
          }`}
        >
          Executar
          <span className="ml-1.5 tabular-nums opacity-80">{execCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'prazo'}
          onClick={() => onTabChange('prazo')}
          className={`flex-1 py-2.5 font-mono text-[11px] uppercase tracking-wide border-l border-line transition-colors ${
            tab === 'prazo' ? AXEL_FILTER_PILL_ACTIVE : AXEL_FILTER_PILL_IDLE
          }`}
        >
          Prazo
          <span className="ml-1.5 tabular-nums opacity-80">{dueCount}</span>
        </button>
      </div>

      <div
        className="lg:hidden shrink-0 flex flex-col min-w-0 border border-line rounded-sl bg-card overflow-hidden touch-pan-y max-h-[min(420px,calc(100dvh-14rem))]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col min-h-0 overflow-hidden">
          {tab === 'executar' ? executar : prazo}
        </div>
      </div>

      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          aria-label="Nova demanda"
          className={`lg:hidden fixed bottom-20 right-4 z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${AXEL_BTN_PRIMARY}`}
        >
          <Plus size={20} strokeWidth={2} />
        </button>
      )}

      <div className={`hidden lg:flex ${AXEL_KANBAN_WORKSPACE}`}>
        {executar}
        {prazo}
      </div>
    </div>
  )
}
