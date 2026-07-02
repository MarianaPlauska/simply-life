import { useRef, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { AXEL_BTN_PRIMARY, AXEL_VIEW_SWITCHER_SHELL } from '../../constants/axelSurfaces'

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

const MOBILE_TAB_ACTIVE =
  'bg-white text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.04)] dark:bg-zinc-700/80 dark:text-zinc-100 dark:shadow-none'

const MOBILE_TAB_IDLE =
  'text-zinc-500 hover:text-zinc-700 hover:bg-white/50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/40'

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
    <div className="flex-1 min-h-0 flex flex-col relative mt-1 sm:mt-0 lg:hidden">
      <div
        className={`shrink-0 flex rounded-lg overflow-hidden ${AXEL_VIEW_SWITCHER_SHELL}`}
        role="tablist"
        aria-label="Painel do planejador"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'executar'}
          onClick={() => onTabChange('executar')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-sans text-[11px] font-medium transition-colors ${
            tab === 'executar' ? MOBILE_TAB_ACTIVE : MOBILE_TAB_IDLE
          }`}
        >
          Executar
          <span className="tabular-nums opacity-80">{execCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'prazo'}
          onClick={() => onTabChange('prazo')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 font-sans text-[11px] font-medium border-l border-line transition-colors ${
            tab === 'prazo' ? MOBILE_TAB_ACTIVE : MOBILE_TAB_IDLE
          }`}
        >
          Prazo
          <span className="tabular-nums opacity-80">{dueCount}</span>
        </button>
      </div>

      <div
        className="shrink-0 flex flex-col min-w-0 mt-2.5 border border-line rounded-lg bg-card shadow-sl overflow-hidden touch-pan-y max-h-[min(400px,calc(100dvh-14rem))]"
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
    </div>
  )
}
