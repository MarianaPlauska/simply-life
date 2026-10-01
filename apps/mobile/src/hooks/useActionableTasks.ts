import { useEffect, useMemo } from 'react'
import { actionableTasks, type MobileTask } from '@simply-life/shared'
import { useTaskWaitStore } from '../store/taskWaitStore'

/** Tarefas sem espera aberta: o que dá para tocar agora (sugestões e foco do Axel). */
export function useActionableTasks(tasks: MobileTask[]): MobileTask[]
{
  const waits = useTaskWaitStore((s) => s.waits)
  const hydrate = useTaskWaitStore((s) => s.hydrate)

  useEffect(() =>
  {
    void hydrate()
  }, [hydrate])

  return useMemo(() => actionableTasks(tasks, waits), [tasks, waits])
}
