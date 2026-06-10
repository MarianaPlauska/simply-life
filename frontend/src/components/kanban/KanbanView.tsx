import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Target } from 'lucide-react'
import { getEnergyPeriod, shouldHighlightNobleHour } from '../../lib/energyOrchestration'
import { useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { KanbanCommandBar } from './KanbanCommandBar'
import { KanbanTodayPanel } from './KanbanTodayPanel'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { OrionKanbanListView } from './OrionKanbanListView'
import { OrionKanbanTimelineView } from './OrionKanbanTimelineView'
import { KanbanViewSwitcher, type KanbanViewMode } from './KanbanViewSwitcher'
import { OrionKanbanCard } from './OrionKanbanCard'
import { OrionKanbanColumn } from './OrionKanbanColumn'
import { OrionTaskDrawer } from './OrionTaskDrawer'
import { OrionAbsoluteFocusOverlay } from './OrionAbsoluteFocusOverlay'
import { OrionAchievementTrail } from './OrionAchievementTrail'
import { OrionFlowSuggestionButton } from './OrionFlowSuggestionButton'
import {
  applyUrgencyScores,
  calculateUrgencyScores,
} from '../../lib/urgencyEngine'
import {
  calculateAdaptiveUrgency,
  computeDailyLoadBalancer,
  sumHojeScore,
} from '../../lib/adaptiveOrchestration'
import { recordOrchestrationMetrics } from '../../lib/contextRationale'
import {
  HORIZON_LABELS,
  bucketByTemporalHorizon,
  resolveTemporalHorizon,
  type TemporalHorizon,
} from '../../lib/temporalHorizon'
import { useOrionIngestion } from '../../hooks/useOrionIngestion'
import {
  ORION_KANBAN_GLOW,
  ORION_KANBAN_PAGE,
  ORION_KANBAN_PLAN_SHELL,
  ORION_KANBAN_TOOLBAR,
  ORION_KANBAN_WORKSPACE,
} from '../../constants/orionKanbanTheme'
import { ORION_TEXT_SECONDARY } from '../../constants/orionSurfaces'
import { ORION_BTN_PRIMARY } from '../../constants/orionSurfaces'
import type { TarefaUnificada } from '../../types'

// Orquestrador Temporal — colunas por horizonte (Bitrix logic)

const HORIZONS: TemporalHorizon[] = ['hoje', 'semana', 'backlog']

const PLAN_COLUMNS: { id: TemporalHorizon; title: string }[] = [
  { id: 'semana', title: 'Esta Semana' },
  { id: 'backlog', title: 'Backlog / Próximo' },
]

export function KanbanView()
{
  const [searchParams, setSearchParams] = useSearchParams()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)
  const moveTask = useTaskStore((s) => s.moveTask)
  const recordTaskMoved = useTaskStore((s) => s.recordTaskMoved)
  const setZenFocusActive = useTaskStore((s) => s.setZenFocusActive)
  const zenFocusActive = useTaskStore((s) => s.zenFocusActive)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)
  const realtimeStatus = useTaskStore((s) => s.realtimeStatus)
  const orionIngestionPolling = useTaskStore((s) => s.orionIngestionPolling)

  const { highlightIds } = useOrionIngestion({ enabled: true })

  const webhookListening =
    realtimeStatus === 'live' || orionIngestionPolling

  const [viewMode, setViewMode] = useState<KanbanViewMode>('board')
  const [viewVisible, setViewVisible] = useState(true)

  const handleViewModeChange = (next: KanbanViewMode) =>
  {
    if (next === viewMode) return
    setViewVisible(false)
    window.setTimeout(() =>
    {
      setViewMode(next)
      setViewVisible(true)
    }, 200)
  }
  const [scoreOverrides, setScoreOverrides] = useState<Record<number, number>>({})
  const [horizonOverrides, setHorizonOverrides] = useState<Record<number, TemporalHorizon>>({})
  const [orchestrating, setOrchestrating] = useState(false)
  const [metricsKey, setMetricsKey] = useState(0)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [drawerCreating, setDrawerCreating] = useState(false)
  const [createHorizon, setCreateHorizon] = useState<TemporalHorizon>('backlog')
  const [focusTaskId, setFocusTaskId] = useState<number | null>(null)

  const execution = useTaskStore((s) => s.execution)
  const { startTask } = useStartTaskExecution()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const tarefas = useMemo(() =>
  {
    const merged = mergeDashboardTasks(storeTarefas).map((t) =>
    {
      const score = scoreOverrides[t.id] ?? t.score_urgencia
      if (score === t.score_urgencia) return t
      return { ...t, score_urgencia: score }
    })
    return merged
  }, [storeTarefas, scoreOverrides])

  const columns = useMemo(
    () => bucketByTemporalHorizon(tarefas, horizonOverrides),
    [tarefas, horizonOverrides],
  )

  const hojeLoadBalance = useMemo(
    () => computeDailyLoadBalancer(columns.hoje, dailyScoreCap),
    [columns.hoje, dailyScoreCap],
  )

  const hojeActiveSorted = useMemo(
    () =>
      columns.hoje
        .filter((t) => t.status !== 'concluida')
        .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0)),
    [columns.hoje],
  )

  const heroTask = useMemo(() =>
  {
    if (focusTaskId != null)
    {
      return hojeActiveSorted.find((t) => t.id === focusTaskId)
        ?? tarefas.find((t) => t.id === focusTaskId)
        ?? null
    }
    return hojeActiveSorted[0] ?? null
  }, [focusTaskId, hojeActiveSorted, tarefas])

  useEffect(() =>
  {
    if (hojeActiveSorted.length === 0)
    {
      setFocusTaskId(null)
      return
    }
    if (focusTaskId == null || !hojeActiveSorted.some((t) => t.id === focusTaskId))
    {
      setFocusTaskId(hojeActiveSorted[0].id)
    }
  }, [hojeActiveSorted, focusTaskId])

  const [energyPeriod, setEnergyPeriod] = useState(() => getEnergyPeriod())

  useEffect(() =>
  {
    const tick = () => setEnergyPeriod(getEnergyPeriod())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  const loadCapLoggedRef = useRef(false)

  useEffect(() =>
  {
    const sum = sumHojeScore(columns.hoje)
    if (sum > dailyScoreCap && !loadCapLoggedRef.current)
    {
      loadCapLoggedRef.current = true
      pushAiDecision(
        `Carga de HOJE (${sum} pts) excedeu o cap (${dailyScoreCap}). Demandas de menor score foram adiadas.`,
      )
    }
    if (sum <= dailyScoreCap)
    {
      loadCapLoggedRef.current = false
    }
  }, [columns.hoje, dailyScoreCap, pushAiDecision])

  const gargalos = useMemo(() =>
  {
    const now = Date.now()
    return tarefas.filter((t) =>
    {
      if (t.status === 'concluida' || !t.data_vencimento) return false
      return new Date(t.data_vencimento).getTime() < now
    }).length
  }, [tarefas])

  const taskIdParam = searchParams.get('task')
  const selectedTask = useMemo(() =>
  {
    if (!taskIdParam) return null
    const id = Number(taskIdParam)
    if (Number.isNaN(id)) return null
    return tarefas.find((t) => t.id === id) ?? null
  }, [taskIdParam, tarefas])

  const selectedHorizon = useMemo(() =>
  {
    if (!selectedTask) return 'backlog' as TemporalHorizon
    return resolveTemporalHorizon(selectedTask, horizonOverrides[selectedTask.id])
  }, [selectedTask, horizonOverrides])

  const activeTask = useMemo(
    () => (activeId !== null ? tarefas.find((t) => t.id === activeId) ?? null : null),
    [activeId, tarefas],
  )

  const handleOpen = (t: TarefaUnificada) =>
  {
    setDrawerCreating(false)
    setSearchParams({ task: String(t.id) })
  }

  const handleCloseDrawer = () =>
  {
    setDrawerCreating(false)
    setSearchParams({})
  }

  const openCreateDrawer = (horizon: TemporalHorizon = 'backlog') =>
  {
    setCreateHorizon(horizon)
    setDrawerCreating(true)
    setSearchParams({})
  }

  const moveToHorizon = useCallback(async (task: TarefaUnificada, horizon: TemporalHorizon) =>
  {
    const current = resolveTemporalHorizon(task, horizonOverrides[task.id])
    if (current === horizon) return

    recordTaskMoved(task.id)
    setHorizonOverrides((prev) => ({ ...prev, [task.id]: horizon }))

    if (horizon === 'hoje')
    {
      const boosted = Math.max(task.score_urgencia ?? 0, 92)
      setScoreOverrides((prev) => ({ ...prev, [task.id]: boosted }))
      if (task.id > 0)
      {
        await updateTarefa(task.id, { score_urgencia: boosted, status: 'em_progresso' })
      }
    }
    else if (horizon === 'semana')
    {
      if (task.id > 0)
      {
        await moveTask(task.id, 'em_progresso')
      }
    }
    else if (task.id > 0)
    {
      await moveTask(task.id, 'pendente')
    }

    toast.success(`Movido para ${HORIZON_LABELS[horizon]}`)
  }, [horizonOverrides, updateTarefa, moveTask, recordTaskMoved])

  const moveTasksForFlow = useCallback(
    async (taskIds: number[], target: TemporalHorizon) =>
    {
      for (const id of taskIds)
      {
        const task = tarefas.find((t) => t.id === id)
        if (task) await moveToHorizon(task, target)
      }
      pushAiDecision('Sugestão de fluxo aplicada — carga de HOJE aliviada.')
    },
    [tarefas, moveToHorizon, pushAiDecision],
  )

  const openZenFocus = useCallback(() =>
  {
    const buckets = bucketByTemporalHorizon(tarefas, horizonOverrides)
    const top = buckets.hoje
      .filter((t) => t.status !== 'concluida')
      .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))[0]

    if (!top)
    {
      toast.error('Nenhuma demanda em HOJE para foco absoluto')
      return
    }

    setZenFocusActive(true, top.id)
  }, [tarefas, horizonOverrides, setZenFocusActive])

  useEffect(() =>
  {
    const onKey = (e: KeyboardEvent) =>
    {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f')
      {
        e.preventDefault()
        if (zenFocusActive)
        {
          setZenFocusActive(false)
        }
        else
        {
          openZenFocus()
        }
      }
      if (e.key === 'Escape' && zenFocusActive)
      {
        setZenFocusActive(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zenFocusActive, setZenFocusActive, openZenFocus])

  useEffect(() =>
  {
    return () => setZenFocusActive(false)
  }, [setZenFocusActive])

  const handleDragStart = (event: DragStartEvent) =>
  {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) =>
  {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    const task = tarefas.find((t) => t.id === active.id)
    if (!task) return

    const target = over.id as TemporalHorizon
    if (!HORIZONS.includes(target)) return

    void moveToHorizon(task, target)
  }

  const handleTaskCreated = (task: TarefaUnificada) =>
  {
    setDrawerCreating(false)
    setHorizonOverrides((prev) => ({ ...prev, [task.id]: createHorizon }))
    setSearchParams({ task: String(task.id) })
  }

  const handleRecalculate = useCallback(async () =>
  {
    setOrchestrating(true)
    try
    {
      const scores = await calculateUrgencyScores(tarefas)
      const scoreMap: Record<number, number> = {}

      for (const entry of scores)
      {
        scoreMap[entry.taskId] = entry.score
        const task = tarefas.find((t) => t.id === entry.taskId)
        const adaptive = task ? calculateAdaptiveUrgency(task, tarefas) : null
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
      setHorizonOverrides({})

      const rescored = applyUrgencyScores(tarefas, scores)
      const hoje = rescored.filter((t) =>
        resolveTemporalHorizon(t) === 'hoje',
      ).length

      recordOrchestrationMetrics(scores.length)
      setMetricsKey((k) => k + 1)

      toast.success(`Orquestração temporal · ${hoje} em Hoje`, {
        description: scores.every((s) => s.source === 'mock')
          ? 'Motor mock — configure VITE_GROQ_API_KEY para IA real'
          : 'Horizontes recalculados pelo Motor de Contexto',
      })
    }
    catch (err)
    {
      console.error('[KanbanView] recálculo falhou:', err)
      toast.error('Falha ao recalcular prioridades')
    }
    finally
    {
      setOrchestrating(false)
    }
  }, [tarefas, updateTarefa])

  if (zenFocusActive)
  {
    return (
      <>
        <OrionAbsoluteFocusOverlay horizonOverrides={horizonOverrides} />
      </>
    )
  }

  return (
    <div className={`relative w-full h-full min-h-0 flex flex-col flex-1 min-w-0 ${ORION_KANBAN_PAGE}`}>
      <div className={ORION_KANBAN_GLOW} aria-hidden />

      <div className="relative z-10 w-full flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-5 lg:px-7 pt-5 pb-4 flex flex-col gap-4 max-w-[1680px] mx-auto w-full">
          <header className={`shrink-0 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between pb-4 ${ORION_KANBAN_TOOLBAR}`}>
            <div>
              <p className="sl-eyebrow mb-2">Orion · Execução</p>
              <h1 className="text-2xl sm:text-[1.85rem] font-display tracking-tight text-ink leading-tight">
                Centro de Execução
              </h1>
              <p className="text-[12px] mt-1.5 text-ink-muted font-mono max-w-lg">
                Hoje à esquerda · planejamento à direita · arraste entre painéis ·{' '}
                <kbd className="font-mono text-[10px] px-1 py-0.5 border border-line rounded-sl bg-chrome">
                  Ctrl+Shift+F
                </kbd>{' '}
                foco
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <KanbanViewSwitcher mode={viewMode} onChange={handleViewModeChange} />
              <button
                type="button"
                onClick={() => openZenFocus()}
                className="inline-flex items-center gap-1.5 border border-line text-ink-muted hover:text-accent hover:border-accent/40 font-mono text-[11px] uppercase tracking-wide px-3 py-2 rounded-sl transition-colors"
                title="Foco Absoluto (Ctrl+Shift+F)"
              >
                <Target size={14} strokeWidth={1.75} aria-hidden />
                Foco
              </button>
              <OrionFlowSuggestionButton
                hojeTasks={columns.hoje}
                dailyScoreCap={dailyScoreCap}
                onMoveTasks={moveTasksForFlow}
              />
              <button
                type="button"
                onClick={() => openCreateDrawer('backlog')}
                className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 ${ORION_BTN_PRIMARY}`}
              >
                Nova demanda
              </button>
            </div>
          </header>

          <KanbanCommandBar
            key={`kanban-cmd-${metricsKey}`}
            tarefas={tarefas}
            hojeTasks={columns.hoje}
            hojeCount={columns.hoje.length}
            dailyScoreCap={dailyScoreCap}
            gargalos={gargalos}
            intelligenceOn={webhookListening}
            onRecalculate={handleRecalculate}
            loading={orchestrating}
          />

        </div>

        <div
          className={`flex-1 min-h-0 flex flex-col px-5 lg:px-7 pb-4 max-w-[1680px] mx-auto w-full sl-kanban-canvas transition-opacity duration-200 ${
            viewVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
        {viewMode === 'list' && (
          <OrionKanbanListView
            tarefas={tarefas}
            horizonOverrides={horizonOverrides}
            onOpen={handleOpen}
          />
        )}

        {viewMode === 'timeline' && (
          <OrionKanbanTimelineView tarefas={tarefas} onOpen={handleOpen} />
        )}

        {viewMode === 'board' && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className={ORION_KANBAN_WORKSPACE}>
              <KanbanTodayPanel
                tasks={hojeActiveSorted}
                totalCount={columns.hoje.length}
                selectedId={focusTaskId}
                selectedTask={heroTask}
                executingId={execution?.taskId ?? null}
                loadBalance={hojeLoadBalance}
                isExecuting={heroTask != null && execution?.taskId === heroTask.id}
                onSelect={setFocusTaskId}
                onOpen={handleOpen}
                onExecute={() =>
                {
                  if (heroTask) void startTask(heroTask)
                }}
                onAddTask={() => openCreateDrawer('hoje')}
              />

              <div className="flex-1 flex flex-col min-w-0 min-h-0">
                <div className="shrink-0 px-4 py-2 border-b border-line bg-chrome/30">
                  <p className={`font-mono text-[10px] uppercase tracking-[0.14em] ${ORION_TEXT_SECONDARY}`}>
                    02–03 · Planejamento — arraste para Hoje quando for executar
                  </p>
                </div>
                <div className={ORION_KANBAN_PLAN_SHELL}>
                  {PLAN_COLUMNS.map((col) =>
                  {
                    const items = columns[col.id]
                    const scoreSum = items.reduce((s, t) => s + (t.score_urgencia ?? 0), 0)

                    return (
                      <OrionKanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        count={items.length}
                        scoreSum={scoreSum}
                        embedded
                        isEmpty={items.length === 0}
                        onAddTask={() => openCreateDrawer(col.id)}
                      >
                        {items.map((t) => (
                          <OrionKanbanCard
                            key={t.id}
                            tarefa={t}
                            allTasks={tarefas}
                            columnHorizon={col.id}
                            isDragging={activeId === t.id}
                            isIngestionHighlight={highlightIds.includes(t.id)}
                            onOpen={() => handleOpen(t)}
                            onDemoteToBacklog={(task) => void moveToHorizon(task, 'backlog')}
                            nobleHourHighlight={shouldHighlightNobleHour(t, energyPeriod)}
                          />
                        ))}
                      </OrionKanbanColumn>
                    )
                  })}
                </div>
              </div>
            </div>

            <DragOverlay dropAnimation={null}>
              {activeTask && (
                <OrionKanbanCard tarefa={activeTask} allTasks={tarefas} isDragging />
              )}
            </DragOverlay>
          </DndContext>
        )}
        </div>

        <OrionAchievementTrail />

        {(selectedTask || drawerCreating) && (
          <OrionTaskDrawer
            tarefa={selectedTask ?? undefined}
            temporalHorizon={drawerCreating ? createHorizon : selectedHorizon}
            isCreatingNew={drawerCreating}
            onClose={handleCloseDrawer}
            onCreated={handleTaskCreated}
          />
        )}
      </div>
    </div>
  )
}
