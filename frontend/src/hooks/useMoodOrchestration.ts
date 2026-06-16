import { useEffect, useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { buildMoodOrchestrationContext, type MoodOrchestrationContext } from '../lib/moodOrchestration'

export function useMoodOrchestration(): MoodOrchestrationContext
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const fetchHumorResumo = useTaskStore((s) => s.fetchHumorResumo)

  useEffect(() =>
  {
    void fetchHumorResumo()
  }, [fetchHumorResumo])

  return useMemo(
    () => buildMoodOrchestrationContext(humorHojeLista, humorSemanaAgregado, dailyScoreCap),
    [humorHojeLista, humorSemanaAgregado, dailyScoreCap],
  )
}
