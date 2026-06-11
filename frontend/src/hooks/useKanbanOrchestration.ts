import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calculateAdaptiveUrgency } from '../lib/adaptiveOrchestration'
import { recordOrchestrationMetrics } from '../lib/contextRationale'
import { fetchIntelligenceStatus, type IntelligenceMode } from '../lib/orchestrateApi'
import { runPipelineOrchestration } from '../lib/orchestratePipeline'
import type { TemporalHorizon } from '../lib/temporalHorizon'
import type { TarefaUnificada } from '../types'

const AUTO_ORCHESTRATE_KEY = 'axel_kanban_auto_orchestrate'
const DEBOUNCE_MS = 900
const INGEST_DEBOUNCE_MS = 180

function loadAutoEnabled(): boolean
{
  try
  {
    const v = localStorage.getItem(AUTO_ORCHESTRATE_KEY)
    if (v === '0') return false
  }
  catch { /* privado */ }
  return true
}

function persistAutoEnabled(enabled: boolean): void
{
  try
  {
    localStorage.setItem(AUTO_ORCHESTRATE_KEY, enabled ? '1' : '0')
  }
  catch { /* privado */ }
}

interface UseKanbanOrchestrationOptions
{
  tasks: TarefaUnificada[]
  dailyScoreCap: number
  updateTarefa: (id: number, patch: Record<string, unknown>) => Promise<void>
  patchTarefaLocal: (id: number, patch: Partial<TarefaUnificada>) => void
  pushAiDecision: (message: string) => void
  resolveLastMovedAt?: (taskId: number, createdAt: string | null) => string | null
  ingestionTick?: number
}

export function useKanbanOrchestration({
  tasks,
  dailyScoreCap,
  updateTarefa,
  patchTarefaLocal,
  pushAiDecision,
  resolveLastMovedAt,
  ingestionTick = 0,
}: UseKanbanOrchestrationOptions)
{
  const [scoreOverrides, setScoreOverrides] = useState<Record<number, number>>({})
  const [autoHorizons, setAutoHorizons] = useState<Record<number, TemporalHorizon>>({})
  const [manualHorizons, setManualHorizons] = useState<Record<number, TemporalHorizon>>({})
  const [orchestrating, setOrchestrating] = useState(false)
  const [lastRunAt, setLastRunAt] = useState<Date | null>(null)
  const [lastSource, setLastSource] = useState<'ai' | 'mock' | null>(null)
  const [intelligenceReady, setIntelligenceReady] = useState<IntelligenceMode>('unknown')
  const [autoEnabled, setAutoEnabledState] = useState(loadAutoEnabled)
  const [metricsKey, setMetricsKey] = useState(0)

  const runInFlightRef = useRef(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)
  const lastFingerprintRef = useRef<string | null>(null)
  const lastIngestionRef = useRef(0)
  const runRef = useRef<((options?: { clearManual?: boolean }) => Promise<unknown>) | null>(null)

  const taskFingerprint = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'concluida')
        .map(
          (t) =>
            `${t.id}|${t.status}|${t.titulo}|${t.data_vencimento ?? ''}|${t.prioridade}`,
        )
        .sort()
        .join(';'),
    [tasks],
  )

  const setAutoEnabled = useCallback((enabled: boolean) =>
  {
    setAutoEnabledState(enabled)
    persistAutoEnabled(enabled)
  }, [])

  useEffect(() =>
  {
    void fetchIntelligenceStatus().then((status) =>
    {
      if (!status) return
      setIntelligenceReady(status.intelligence === 'ai_ready' ? 'ai_ready' : 'local')
    })
  }, [])

  const applyPipelineResult = useCallback(async (
    result: Awaited<ReturnType<typeof runPipelineOrchestration>>,
  ) =>
  {
    const scoreMap: Record<number, number> = {}

    for (const entry of result.scores)
    {
      scoreMap[entry.taskId] = entry.score
      const task = tasks.find((t) => t.id === entry.taskId)
      const adaptive = task ? calculateAdaptiveUrgency(task, tasks) : null
      const reason = entry.rationale ?? adaptive?.reason
      const intent = adaptive?.intent

      if (entry.taskId > 0)
      {
        await updateTarefa(entry.taskId, {
          score_urgencia: intent?.forceMinScore != null
            ? Math.max(entry.score, intent.forceMinScore)
            : entry.score,
          score_reason: reason ?? null,
          urgency_reason: intent?.urgencyReason ?? null,
          intent_category: intent?.category ?? null,
        })
      }
      else if (task && adaptive?.intent)
      {
        const mockIntent = adaptive.intent
        patchTarefaLocal(entry.taskId, {
          score_reason: reason,
          urgency_reason: mockIntent.urgencyReason,
          intent_category: mockIntent.category,
          score_urgencia: mockIntent.forceMinScore != null
            ? Math.max(entry.score, mockIntent.forceMinScore)
            : entry.score,
        })
      }
    }

    setScoreOverrides(scoreMap)
    setAutoHorizons(result.autoHorizons)
    setLastRunAt(new Date())
    setLastSource(result.source)
    recordOrchestrationMetrics(result.scores.length)
    setMetricsKey((k) => k + 1)

    const sourceLabel = result.source === 'ai' ? 'IA AXEL' : 'motor local'
    pushAiDecision(
      `Reorganizei ${result.scores.length} demandas (${sourceLabel}) · ${result.hojeCount} em Hoje.`,
    )

    for (const entry of result.scores)
    {
      const task = tasks.find((t) => t.id === entry.taskId)
      const horizon = result.autoHorizons[entry.taskId]
      if (!task || !horizon || horizon !== 'hoje') continue
      const why = entry.rationale ?? task.score_reason ?? 'prioridade alta'
      pushAiDecision(`Hoje · ${task.titulo.slice(0, 48)} (${entry.score} pts) — ${why}`)
    }

    for (const d of result.decisions.slice(0, 6))
    {
      pushAiDecision(d.message)
    }

    return result
  }, [tasks, updateTarefa, patchTarefaLocal, pushAiDecision])

  const runOrchestration = useCallback(async (options?: { clearManual?: boolean }) =>
  {
    if (runInFlightRef.current) return null
    const active = tasks.filter((t) => t.status !== 'concluida')
    if (active.length === 0) return null

    runInFlightRef.current = true
    setOrchestrating(true)

    try
    {
      if (options?.clearManual)
      {
        setManualHorizons({})
      }

      const result = await runPipelineOrchestration(tasks, dailyScoreCap, {
        lastMovedAt: resolveLastMovedAt,
      })
      await applyPipelineResult(result)
      return result
    }
    finally
    {
      runInFlightRef.current = false
      setOrchestrating(false)
    }
  }, [tasks, dailyScoreCap, applyPipelineResult, resolveLastMovedAt])

  runRef.current = runOrchestration

  const setManualHorizon = useCallback((taskId: number, horizon: TemporalHorizon) =>
  {
    setManualHorizons((prev) => ({ ...prev, [taskId]: horizon }))
    pushAiDecision(`Você moveu manualmente — AXEL respeita até a próxima reorganização completa.`)
  }, [pushAiDecision])

  const clearManualHorizon = useCallback((taskId: number) =>
  {
    setManualHorizons((prev) =>
    {
      const next = { ...prev }
      delete next[taskId]
      return next
    })
  }, [])

  // Auto-organização — dispara em mudanças reais de demanda, não em loop de score
  useEffect(() =>
  {
    if (!autoEnabled) return
    if (taskFingerprint.length === 0) return

    const ingestionBurst = ingestionTick > 0 && ingestionTick !== lastIngestionRef.current
    if (ingestionBurst)
    {
      lastIngestionRef.current = ingestionTick
      pushAiDecision('Nova demanda ingerida — reorganizando prioridades agora.')
    }

    const isFirstRun = !mountedRef.current
    if (
      !isFirstRun
      && !ingestionBurst
      && taskFingerprint === lastFingerprintRef.current
    )
    {
      return
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const delay = ingestionBurst ? INGEST_DEBOUNCE_MS : isFirstRun ? 400 : DEBOUNCE_MS
    debounceRef.current = setTimeout(() =>
    {
      void runRef.current?.({ clearManual: false })?.then(() =>
      {
        lastFingerprintRef.current = taskFingerprint
      })
    }, delay)

    mountedRef.current = true

    return () =>
    {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [autoEnabled, taskFingerprint, ingestionTick, dailyScoreCap, pushAiDecision])

  const horizonOverrides = { ...autoHorizons, ...manualHorizons }

  return {
    scoreOverrides,
    horizonOverrides,
    manualHorizons,
    autoHorizons,
    orchestrating,
    lastRunAt,
    lastSource,
    intelligenceReady,
    autoEnabled,
    setAutoEnabled,
    metricsKey,
    runOrchestration,
    setManualHorizon,
    clearManualHorizon,
  }
}
