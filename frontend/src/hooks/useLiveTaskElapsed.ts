import { useEffect, useState } from 'react'
import { useTaskStore } from '../store/useTaskStore'

/** Segundos acumulados na tarefa — atualiza a cada 1s enquanto o foco está ativo */
export function useLiveTaskElapsed(taskId: number | null, isActive: boolean): number
{
  const getTaskElapsedSeconds = useTaskStore((s) => s.getTaskElapsedSeconds)
  const [, tick] = useState(0)

  useEffect(() =>
  {
    if (!isActive || taskId == null) return
    const id = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [isActive, taskId])

  if (taskId == null) return 0
  return getTaskElapsedSeconds(taskId)
}
