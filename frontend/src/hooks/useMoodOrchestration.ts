import { useEffect, useMemo } from 'react'
import { useTaskStore } from '../store/useTaskStore'
import { buildMoodOrchestrationContext, type MoodOrchestrationContext } from '../lib/moodOrchestration'
import { computeMentalLoad } from '../lib/energyOrchestration'
import { resolveTemporalHorizon } from '../lib/temporalHorizon'
import {
  applyAxelRecoveryBoost,
  evaluateAxelAutoRecovery,
} from '../lib/axelRecoveryMode'

export function useMoodOrchestration(): MoodOrchestrationContext
{
  const humorHojeLista = useTaskStore((s) => s.humorHojeLista)
  const humorSemanaAgregado = useTaskStore((s) => s.humorSemanaAgregado)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const tarefas = useTaskStore((s) => s.tarefas)
  const userStats = useTaskStore((s) => s.userStats)
  const fetchHumorResumo = useTaskStore((s) => s.fetchHumorResumo)

  useEffect(() =>
  {
    void fetchHumorResumo()
  }, [fetchHumorResumo])

  return useMemo(
    () =>
    {
      const base = buildMoodOrchestrationContext(
        humorHojeLista,
        humorSemanaAgregado,
        dailyScoreCap,
      )

      const hojeTasks = tarefas.filter((t) => resolveTemporalHorizon(t) === 'hoje')
      const load = computeMentalLoad(
        hojeTasks.filter((t) => t.status !== 'concluida'),
        dailyScoreCap,
        base,
      )

      const decision = evaluateAxelAutoRecovery({
        level: userStats?.level ?? 1,
        humorHoje: humorHojeLista,
        humorSemana: humorSemanaAgregado,
        kanbanLoadPct: load.percent,
      })

      return applyAxelRecoveryBoost(base, decision)
    },
    [humorHojeLista, humorSemanaAgregado, dailyScoreCap, tarefas, userStats?.level],
  )
}
