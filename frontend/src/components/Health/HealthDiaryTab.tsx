import { MoodTracker } from './MoodTracker'
import { HealthNoteComposer } from './HealthNoteComposer'
import { MoodDiarySection } from '../wellbeing/MoodDiarySection'
import { AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function HealthDiaryTab()
{
  return (
    <section className="space-y-4">
      <p className={`text-[12px] leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        Humor, reações e notas no mesmo lugar. O feed abaixo mistura registros de humor com suas anotações.
      </p>
      <MoodTracker />
      <HealthNoteComposer />
      <MoodDiarySection defaultView="diario" />
    </section>
  )
}
