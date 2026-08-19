import { ChevronDown } from 'lucide-react'
import { MoodTracker } from './MoodTracker'
import { HealthNoteComposer } from './HealthNoteComposer'
import { MoodDiarySection } from '../wellbeing/MoodDiarySection'
import { WeeklyReviewCard } from './WeeklyReviewCard'
import { DashboardCollapsible } from '../dashboard/DashboardCollapsible'

export function HealthDiaryTab()
{
  return (
    <section className="space-y-4">
      <MoodTracker />
      <HealthNoteComposer />
      <MoodDiarySection defaultView="historico" />
      <DashboardCollapsible
        title="Revisão da semana"
        icon={<ChevronDown className="w-4 h-4 text-accent shrink-0 group-open:rotate-180 transition-transform" />}
        className="border border-line/80"
      >
        <WeeklyReviewCard />
      </DashboardCollapsible>
    </section>
  )
}
