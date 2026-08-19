import { useRef, type ReactNode } from 'react'

export type MobileBoardTab = 'executar' | 'prazo'

interface KanbanMobileBoardShellProps
{
  executar: ReactNode
  prazo: ReactNode
  execCount: number
  dueCount: number
  tab: MobileBoardTab
  onTabChange: (tab: MobileBoardTab) => void
}

const SWIPE_THRESHOLD_PX = 48

const TAB_BASE =
  'flex-1 flex items-center justify-center gap-2 min-h-[44px] px-2 font-sans text-[13px] transition-colors'

const TAB_ACTIVE = 'text-ink font-semibold'
const TAB_IDLE = 'text-ink-muted font-medium hover:text-ink'

export function KanbanMobileBoardShell({
  executar,
  prazo,
  execCount,
  dueCount,
  tab,
  onTabChange,
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
    <div className="flex-1 min-h-0 flex flex-col relative mt-2 lg:hidden">
      <div
        className="shrink-0 flex w-full gap-1"
        role="tablist"
        aria-label="Listas"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'executar'}
          onClick={() => onTabChange('executar')}
          className={`${TAB_BASE} ${tab === 'executar' ? TAB_ACTIVE : TAB_IDLE}`}
        >
          Hoje
          <span className="tabular-nums text-ink-muted">{execCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'prazo'}
          onClick={() => onTabChange('prazo')}
          className={`${TAB_BASE} ${tab === 'prazo' ? TAB_ACTIVE : TAB_IDLE}`}
        >
          Todas
          <span className="tabular-nums text-ink-muted">{dueCount}</span>
        </button>
      </div>

      <div
        className="flex-1 min-h-0 flex flex-col mt-3 overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {tab === 'executar' ? executar : prazo}
        </div>
      </div>
    </div>
  )
}
