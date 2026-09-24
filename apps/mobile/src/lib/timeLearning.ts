import { useMemo } from 'react'
import { learnTimeFactors, type TimeLearning } from '@simply-life/shared'
import { useDataStore } from '../store/dataStore'
import { useFocusLogStore } from '../store/focusLogStore'
import { useNeuroStore } from '../store/neuroStore'

/** O que o Axel aprendeu do tempo real de foco (null se a pessoa desligou o aprendizado). */
export function useTimeLearning(): TimeLearning | null
{
  const tasks = useDataStore((s) => s.tasks)
  const sessions = useFocusLogStore((s) => s.sessions)
  const enabled = useNeuroStore((s) => s.useLearnedTimes)
  return useMemo(
    () => (enabled ? learnTimeFactors(tasks ?? [], sessions) : null),
    [tasks, sessions, enabled],
  )
}

export function timeLearningNow(): TimeLearning | null
{
  if (!useNeuroStore.getState().useLearnedTimes) return null
  return learnTimeFactors(useDataStore.getState().tasks ?? [], useFocusLogStore.getState().sessions)
}
