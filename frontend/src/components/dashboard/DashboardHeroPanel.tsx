import { DailyEngagementCard } from './DailyEngagementCard'
import { DashboardAxelFocus } from './DashboardAxelFocus'

// Hero do dashboard — ofensiva + main quest no mesmo card (sem vazio lateral)

interface DashboardHeroPanelProps
{
  onOpenTask?: (taskId: number) => void
  onExecuteTask?: (taskId: number) => void
}

export function DashboardHeroPanel({ onOpenTask, onExecuteTask }: DashboardHeroPanelProps)
{
  return (
    <section
      className="rounded-sl border border-line bg-card overflow-hidden"
      aria-label="Foco do dia"
    >
      <DailyEngagementCard variant="strip" />
      <div className="border-t border-line">
        <DashboardAxelFocus
          embedded
          onOpenTask={onOpenTask}
          onExecuteTask={onExecuteTask}
        />
      </div>
    </section>
  )
}
