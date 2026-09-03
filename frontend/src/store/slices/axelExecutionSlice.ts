import type { StateCreator } from 'zustand'
import { applyVelocityToEstimate } from '../../lib/adaptiveOrchestration'
import type { TarefaUnificada } from '../../types'

// Execution Engine - timer, estimativas e tempo real acumulado

const ESTIMATES_KEY = 'axel-task-estimates-v1'
const ELAPSED_KEY = 'axel-task-elapsed-v1'

function loadJsonRecord(key: string): Record<string, number>
{
  try
  {
    const raw = localStorage.getItem(key)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, number>
  }
  catch
  {
    return {}
  }
}

function saveJsonRecord(key: string, data: Record<string, number>): void
{
  localStorage.setItem(key, JSON.stringify(data))
}

export interface AxelExecutionState
{
  taskId: number
  estimateMinutes: number
  startedAtMs: number
}

export interface AxelExecutionSlice
{
  execution: AxelExecutionState | null
  taskEstimates: Record<number, number>
  taskElapsedSeconds: Record<number, number>
  setTaskEstimate: (taskId: number, minutes: number) => void
  refreshTaskEstimateFromTask: (
    task: TarefaUnificada,
    activityEntryCount?: number,
    options?: { difficultySignal?: boolean },
  ) => Promise<void>
  startExecution: (taskId: number, estimateMinutes: number) => void
  stopExecution: () => void
  getTaskElapsedSeconds: (taskId: number) => number
}

type ExecutionStore = AxelExecutionSlice & {
  addDailyFocusMinutes: (minutes: number) => void
  recordVelocitySample: (
    titulo: string,
    estimateMinutes: number,
    actualMinutes: number,
  ) => void
  personalVelocityFactor: number
  pushAiDecision: (message: string) => void
  tarefas: Array<{ id: number; titulo: string }>
}

export const createAxelExecutionSlice: StateCreator<
  ExecutionStore,
  [],
  [],
  AxelExecutionSlice
> = (set, get) =>
{
  const initialEstimates: Record<number, number> = {}
  const initialElapsed: Record<number, number> = {}

  for (const [k, v] of Object.entries(loadJsonRecord(ESTIMATES_KEY)))
  {
    initialEstimates[Number(k)] = v
  }
  for (const [k, v] of Object.entries(loadJsonRecord(ELAPSED_KEY)))
  {
    initialElapsed[Number(k)] = v
  }

  return {
    execution: null,
    taskEstimates: initialEstimates,
    taskElapsedSeconds: initialElapsed,

    setTaskEstimate: (taskId, minutes) =>
    {
      const safe = Math.max(5, Math.min(480, Math.round(minutes)))
      set((s) =>
      {
        const next = { ...s.taskEstimates, [taskId]: safe }
        const flat: Record<string, number> = {}
        for (const [id, m] of Object.entries(next))
        {
          flat[String(id)] = m
        }
        saveJsonRecord(ESTIMATES_KEY, flat)
        return { taskEstimates: next }
      })
    },

    refreshTaskEstimateFromTask: async (task, activityEntryCount = 0, options) =>
    {
      if (!task.id) return

      const elapsedMin = Math.floor(get().getTaskElapsedSeconds(task.id) / 60)
      const { resolveTaskEstimate } = await import('../../services/axelTaskEstimateService')
      const resolved = await resolveTaskEstimate(
        task,
        activityEntryCount,
        elapsedMin,
        options?.difficultySignal ?? false,
      )

      const factor = get().personalVelocityFactor ?? 1
      const adjusted = applyVelocityToEstimate(resolved.estimate_minutes, factor)
      const current = get().taskEstimates[task.id] ?? 0
      const next = Math.max(current, adjusted)

      if (next <= current && !options?.difficultySignal) return

      const finalEstimate = Math.max(next, current)
      get().setTaskEstimate(task.id, finalEstimate)

      const ex = get().execution
      if (ex?.taskId === task.id)
      {
        set({ execution: { ...ex, estimateMinutes: finalEstimate } })
      }

      if (finalEstimate > current || resolved.source === 'groq')
      {
        const prefix = resolved.source === 'groq'
          ? 'IA · '
          : resolved.iaDisponivel === false
            ? 'Local (IA não configurada no servidor) · '
            : 'Local · '
        get().pushAiDecision(
          `${prefix}Estimativa ${finalEstimate} min - ${resolved.reasoning}`,
        )
      }
    },

    startExecution: (taskId, estimateMinutes) =>
    {
      const mins = Math.max(5, Math.min(480, Math.round(estimateMinutes)))
      get().setTaskEstimate(taskId, mins)
      set({
        execution: {
          taskId,
          estimateMinutes: mins,
          startedAtMs: Date.now(),
        },
      })
    },

    stopExecution: () =>
    {
      const ex = get().execution
      if (!ex)
      {
        set({ execution: null })
        return
      }

      const delta = Math.floor((Date.now() - ex.startedAtMs) / 1000)
      set((s) =>
      {
        const nextElapsed = {
          ...s.taskElapsedSeconds,
          [ex.taskId]: (s.taskElapsedSeconds[ex.taskId] ?? 0) + delta,
        }
        const flat: Record<string, number> = {}
        for (const [id, sec] of Object.entries(nextElapsed))
        {
          flat[String(id)] = sec
        }
        saveJsonRecord(ELAPSED_KEY, flat)
        return { execution: null, taskElapsedSeconds: nextElapsed }
      })

      if (delta >= 60)
      {
        get().addDailyFocusMinutes(delta / 60)
      }

      const task = get().tarefas.find((t) => t.id === ex.taskId)
      const titulo = task?.titulo ?? ''
      const actualMinutes = Math.max(1, delta / 60)
      get().recordVelocitySample(titulo, ex.estimateMinutes, actualMinutes)
    },

    getTaskElapsedSeconds: (taskId) =>
    {
      const base = get().taskElapsedSeconds[taskId] ?? 0
      const ex = get().execution
      if (ex?.taskId === taskId)
      {
        return base + Math.floor((Date.now() - ex.startedAtMs) / 1000)
      }
      return base
    },
  }
}
