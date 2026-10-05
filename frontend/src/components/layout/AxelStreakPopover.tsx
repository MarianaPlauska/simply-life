import { useEffect, useRef, useState } from 'react'
import { Flame } from 'lucide-react'
import { ProductivityHeatmap } from '../dashboard/ProductivityHeatmap'
import { useTaskStore } from '../../store/useTaskStore'

// Elo + heatmap (popover no header)

export function AxelStreakPopover()
{
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const streakPulseNonce = useTaskStore((s) => s.streakPulseNonce)
  const focusMinutesByDate = useTaskStore((s) => s.focusMinutesByDate)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)

  const [open, setOpen] = useState(false)
  const [animating, setAnimating] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() =>
  {
    syncStreakCalendarDay()
  }, [syncStreakCalendarDay])

  useEffect(() =>
  {
    if (streakPulseNonce === 0) return
    setAnimating(true)
    const id = window.setTimeout(() => setAnimating(false), 700)
    return () => clearTimeout(id)
  }, [streakPulseNonce])

  useEffect(() =>
  {
    if (!open) return
    const onDoc = (e: MouseEvent) =>
    {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
      {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const activeToday = hasCompletedTaskToday
  const dayLabel = streakCount === 1 ? 'dia' : 'dias'
  const streakTitle = 'Elo e mapa de foco'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`sl-touch flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-sl border transition-all duration-300 ${
          animating
            ? 'animate-bounce border-atencao/40 bg-atencao/10'
            : open
              ? 'border-accent/30 bg-accent-muted/30'
              : 'border-transparent hover:border-line hover:bg-chrome'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={streakTitle}
      >
        <Flame
          className={`w-4 h-4 shrink-0 transition-colors ${
            activeToday ? 'text-atencao' : 'text-ink-muted'
          } ${animating ? 'animate-pulse' : ''}`}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="hidden sm:inline text-[11px] font-mono tabular-nums text-ink-muted">
          <span
            className={`font-semibold ${
              activeToday
                ? 'text-atencao'
                : 'text-ink-muted'
            }`}
          >
            {streakCount}
          </span>
          {' '}
          {dayLabel}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full mt-2 z-[200] w-[min(100vw-2rem,320px)] rounded-sl border border-line bg-card shadow-lg p-4 space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-accent">Momentum AXEL</p>
              <p className="text-[11px] text-ink-muted mt-0.5">
                {activeToday
                  ? 'Dia cumprido hoje'
                  : 'Uma ação hoje cumpre o dia. Um dia de folga por semana não quebra.'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-display font-semibold tabular-nums text-atencao">
                {streakCount}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                {streakCount === 1 ? 'dia' : 'dias'}
              </p>
            </div>
          </div>

          <ProductivityHeatmap
            focusMinutesByDate={focusMinutesByDate}
            compact
          />

        </div>
      )}
    </div>
  )
}
