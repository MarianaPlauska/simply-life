import { MoodTracker } from './MoodTracker'
import { HealthNoteComposer } from './HealthNoteComposer'
import { MoodDiarySection } from '../wellbeing/MoodDiarySection'
import { WeeklyReviewCard } from './WeeklyReviewCard'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'

export function HealthDiaryTab()
{
  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6 lg:items-start space-y-4 lg:space-y-0 min-w-0">
      <div className="space-y-4 min-w-0">
        <MoodTracker dense />
        <HealthNoteComposer dense />
      </div>

      <div className="space-y-4 min-w-0">
        <MoodDiarySection defaultView="historico" />
        <DashboardCollapsible
          title="Revisão da semana"
          subtitle="Só se quiser olhar o panorama"
          defaultOpen={false}
          className="border border-line/80"
        >
          <WeeklyReviewCard />
        </DashboardCollapsible>
      </div>
    </div>
  )
}
