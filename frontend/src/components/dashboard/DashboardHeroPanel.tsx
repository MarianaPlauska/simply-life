import { DailyEngagementCard } from './DailyEngagementCard'
import { DashboardAxelFocus } from './DashboardAxelFocus'
import { useTaskStore } from '../../store/useTaskStore'
import { buildOffensiveChecklist } from '../../lib/offensiveToday'

// Hero do dashboard · ofensiva + main quest no mesmo painel

interface DashboardHeroPanelProps
{
  onOpenTask?: (taskId: number) => void
}

export function DashboardHeroPanel({ onOpenTask }: DashboardHeroPanelProps)
{
  const streakCount = useTaskStore((s) => s.streakCount)
  const hasCompletedTaskToday = useTaskStore((s) => s.hasCompletedTaskToday)
  const hasWellbeingToday = useTaskStore((s) => s.hasWellbeingToday)

  const offensive = buildOffensiveChecklist(
    hasCompletedTaskToday,
    hasWellbeingToday,
    streakCount,
  )

  return (
    <section
      className={`sl-panel overflow-hidden ${!offensive.safe ? 'sl-panel-emphasis' : ''}`}
      aria-label="Foco do dia"
    >
      <DailyEngagementCard variant="strip" />
      <div className="border-t border-line">
        <DashboardAxelFocus onOpenTask={onOpenTask} />
      </div>
    </section>
  )
}
