import { useEffect } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { MoodWeekSparkline } from '../wellbeing/MoodWeekSparkline'
import { ModuleSection } from '../ui/ModuleSection'

/** Humor da semana — sparkline, sem donut */
export function DashboardMoodWeek()
{
  const humorSemana = useTaskStore((s) => s.humorSemanaAgregado)
  const fetchHumorSemana = useTaskStore((s) => s.fetchHumorSemana)

  useEffect(() =>
  {
    void fetchHumorSemana()
  }, [fetchHumorSemana])

  return (
    <ModuleSection tone="health" label="Humor">
      <MoodWeekSparkline dias={humorSemana} />
    </ModuleSection>
  )
}
