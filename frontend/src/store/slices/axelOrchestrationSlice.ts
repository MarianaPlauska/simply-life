import type { StateCreator } from 'zustand'
import {
  applyVelocityToEstimate,
  DEFAULT_DAILY_SCORE_CAP,
  inferWorkTypeTag,
} from '../../lib/adaptiveOrchestration'

// Orquestração adaptativa — velocidade, log de decisões, cap diário

const VELOCITY_KEY = 'axel-velocity-samples-v1'
const LOG_MAX = 24

export interface AiDecisionEntry
{
  id: string
  message: string
  at: string
}

function loadVelocitySamples(): Record<string, number[]>
{
  try
  {
    const raw = localStorage.getItem(VELOCITY_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, number[]>
  }
  catch
  {
    return {}
  }
}

function saveVelocitySamples(data: Record<string, number[]>): void
{
  localStorage.setItem(VELOCITY_KEY, JSON.stringify(data))
}

export interface AxelOrchestrationSlice
{
  dailyScoreCap: number
  personalVelocityFactor: number
  velocitySamplesByTag: Record<string, number[]>
  aiDecisionLog: AiDecisionEntry[]

  pushAiDecision: (message: string) => void
  setDailyScoreCap: (cap: number) => void
  recordVelocitySample: (titulo: string, estimateMinutes: number, actualMinutes: number) => void
  getAdjustedEstimateMinutes: (taskId: number, titulo: string, baseEstimate?: number) => number
}

export const createAxelOrchestrationSlice: StateCreator<
  AxelOrchestrationSlice,
  [],
  [],
  AxelOrchestrationSlice
> = (set, get) => ({
  dailyScoreCap: DEFAULT_DAILY_SCORE_CAP,
  personalVelocityFactor: 1,
  velocitySamplesByTag: loadVelocitySamples(),
  aiDecisionLog: [],

  pushAiDecision: (message) =>
  {
    const entry: AiDecisionEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      at: new Date().toISOString(),
    }
    set((s) => ({
      aiDecisionLog: [entry, ...s.aiDecisionLog].slice(0, LOG_MAX),
    }))
  },

  setDailyScoreCap: (cap) =>
  {
    set({ dailyScoreCap: Math.max(100, Math.min(1000, Math.round(cap))) })
  },

  recordVelocitySample: (titulo, estimateMinutes, actualMinutes) =>
  {
    if (estimateMinutes <= 0 || actualMinutes <= 0) return

    const tag = inferWorkTypeTag(titulo)
    const ratio = actualMinutes / estimateMinutes

    set((s) =>
    {
      const tagSamples = [...(s.velocitySamplesByTag[tag] ?? []), ratio].slice(-12)
      const velocitySamplesByTag = {
        ...s.velocitySamplesByTag,
        [tag]: tagSamples,
      }
      const allRatios = Object.values(velocitySamplesByTag).flat()
      const avg =
        allRatios.length > 0
          ? allRatios.reduce((a, b) => a + b, 0) / allRatios.length
          : 1
      const personalVelocityFactor = Math.min(
        2,
        Math.max(0.75, Math.round(avg * 100) / 100),
      )

      saveVelocitySamples(velocitySamplesByTag)

      return { velocitySamplesByTag, personalVelocityFactor }
    })

    const factor = get().personalVelocityFactor
    if (Math.abs(factor - 1) >= 0.08)
    {
      get().pushAiDecision(
        `Estimativa ajustada baseada na sua média de velocidade (${factor.toFixed(1)}x).`,
      )
    }
  },

  getAdjustedEstimateMinutes: (taskId, _titulo, baseEstimate) =>
  {
    const store = get() as AxelOrchestrationSlice & {
      taskEstimates?: Record<number, number>
    }
    const base =
      baseEstimate ??
      store.taskEstimates?.[taskId] ??
      45
    return applyVelocityToEstimate(base, get().personalVelocityFactor)
  },
})
