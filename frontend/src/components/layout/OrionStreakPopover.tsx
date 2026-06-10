import { useEffect, useRef, useState } from 'react'
import { Flame, Shield, Snowflake } from 'lucide-react'
import { isWeekendStreakFrozen, WEEKEND_STREAK_TOOLTIP } from '../../lib/weekendStreak'
import { toast } from 'sonner'
import { ProductivityHeatmap } from '../dashboard/ProductivityHeatmap'
import { useTaskStore } from '../../store/useTaskStore'

// Ofensiva + heatmap + compra de escudo (popover no header)

const SHIELD_COST = 500

export function OrionStreakPopover()
{
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const streakPulseNonce = useTaskStore((s) => s.streakPulseNonce)
  const streakFreezes = useTaskStore((s) => s.streakFreezes)
  const focusMinutesByDate = useTaskStore((s) => s.focusMinutesByDate)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)
  const purchaseStreakFreeze = useTaskStore((s) => s.purchaseStreakFreeze)
  const getTotalXp = useTaskStore((s) => s.getTotalXp)

  const [open, setOpen] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [buying, setBuying] = useState(false)
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
  const weekendFreeze = isWeekendStreakFrozen()
  const dayLabel = streakCount === 1 ? 'dia' : 'dias'
  const streakTitle = weekendFreeze
    ? WEEKEND_STREAK_TOOLTIP
    : 'Ofensiva e heatmap de foco'
  const totalXp = getTotalXp()
  const canBuy = totalXp >= SHIELD_COST

  async function handleBuyShield()
  {
    setBuying(true)
    const result = await purchaseStreakFreeze()
    setBuying(false)
    if (result.ok)
    {
      toast.success(result.message, {
        description: 'Protege 1 dia sem prova de trabalho',
        className: 'font-mono text-sm',
      })
    }
    else
    {
      toast.error(result.message, { className: 'font-mono text-sm' })
    }
  }

  return (
    <div ref={rootRef} className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all duration-300 ${
          animating
            ? 'animate-bounce border-orange-500/40 bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.35)]'
            : open
              ? 'border-orange-500/30 bg-orange-500/5'
              : 'border-transparent hover:border-white/[0.06] hover:bg-white/[0.02]'
        }`}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={streakTitle}
      >
        {weekendFreeze ? (
          <Snowflake
            className="w-4 h-4 shrink-0 text-sky-300"
            strokeWidth={1.75}
            aria-hidden
          />
        ) : (
          <Flame
            className={`w-4 h-4 shrink-0 transition-colors ${
              activeToday
                ? 'text-orange-500'
                : 'text-zinc-500 dark:text-zinc-600'
            } ${animating ? 'animate-pulse' : ''}`}
            strokeWidth={1.75}
            aria-hidden
          />
        )}
        <span className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
          <span
            className={`font-semibold ${
              weekendFreeze
                ? 'text-sky-300'
                : activeToday
                  ? 'text-orange-500 dark:text-orange-400'
                  : 'text-zinc-500'
            }`}
          >
            {streakCount}
          </span>
          {' '}
          {dayLabel}
        </span>
        {streakFreezes > 0 && (
          <span className="text-[10px] font-mono text-indigo-400" title="Escudos disponíveis">
            🛡{streakFreezes}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          className="absolute right-0 top-full mt-2 z-[200] w-[min(100vw-2rem,320px)] rounded-xl border border-white/[0.08] bg-[#0B0C14] shadow-2xl shadow-black/50 p-4 space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-zinc-200">Ofensiva ORION</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {weekendFreeze
                  ? WEEKEND_STREAK_TOOLTIP
                  : activeToday
                    ? 'Prova de trabalho validada hoje'
                    : 'Score > 70 + 15 min de timer na tarefa'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-mono font-bold tabular-nums text-orange-400">
                {streakCount}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                {streakCount === 1 ? 'dia' : 'dias'}
              </p>
            </div>
          </div>

          <ProductivityHeatmap
            focusMinutesByDate={focusMinutesByDate}
            compact
          />

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
            <span>Escudos: {streakFreezes}</span>
            <span>XP: {totalXp}</span>
          </div>

          <button
            type="button"
            disabled={buying || !canBuy}
            onClick={() => void handleBuyShield()}
            className="w-full inline-flex items-center justify-center gap-2 h-9 px-3 text-xs font-medium rounded-lg border border-indigo-500/25 bg-indigo-600/10 text-indigo-300 hover:bg-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Shield size={14} strokeWidth={1.75} aria-hidden />
            Comprar Escudo (Custa {SHIELD_COST} XP)
          </button>
        </div>
      )}
    </div>
  )
}
