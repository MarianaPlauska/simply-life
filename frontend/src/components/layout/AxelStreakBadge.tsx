import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// Contador de Ofensiva — header premium com animação ao incrementar

export function AxelStreakBadge()
{
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const streakPulseNonce = useTaskStore((s) => s.streakPulseNonce)
  const syncStreakCalendarDay = useTaskStore((s) => s.syncStreakCalendarDay)

  const [animating, setAnimating] = useState(false)

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

  const activeToday = hasCompletedTaskToday
  const dayLabel = streakCount === 1 ? 'Dia' : 'Dias'

  return (
    <div
      className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all duration-300 ${
        animating
          ? 'animate-bounce border-orange-500/40 bg-orange-500/10 shadow-[0_0_12px_rgba(249,115,22,0.35)]'
          : 'border-transparent'
      }`}
      title={activeToday ? 'Ofensiva ativa hoje' : 'Complete uma tarefa hoje para manter a ofensiva'}
    >
      <Flame
        className={`w-4 h-4 shrink-0 transition-colors ${
          activeToday
            ? 'text-orange-500'
            : 'text-zinc-500 dark:text-zinc-600'
        } ${animating ? 'animate-pulse' : ''}`}
        strokeWidth={1.75}
        aria-hidden
      />
      <span className="text-[11px] font-mono tabular-nums text-zinc-600 dark:text-zinc-400">
        <span
          className={`font-semibold ${
            activeToday ? 'text-orange-500 dark:text-orange-400' : 'text-zinc-500'
          }`}
        >
          {streakCount}
        </span>
        {' '}
        {dayLabel}
      </span>
    </div>
  )
}
