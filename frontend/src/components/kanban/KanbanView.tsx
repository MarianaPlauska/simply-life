import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Target } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { KanbanCommandBar } from './KanbanCommandBar'
import { KanbanDecisionLog } from './KanbanDecisionLog'
import { KanbanNextStep } from './KanbanNextStep'
import { KanbanMorningBrief } from './KanbanMorningBrief'
import { KanbanInsightsPanel } from './KanbanInsightsPanel'
import { KanbanOrchestrationStatus } from './KanbanOrchestrationStatus'
import { KanbanTodayPanel } from './KanbanTodayPanel'
import { useKanbanOrchestration } from '../../hooks/useKanbanOrchestration'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { AxelKanbanListView } from './AxelKanbanListView'
import { KanbanCalendarView } from './KanbanCalendarView'
import { GanttView } from './GanttView'
import { KanbanMobileBoardShell, type MobileBoardTab } from './KanbanMobileBoardShell'
import { resolveKanbanDragIntent } from './KanbanDragSemantics'
import { KanbanBoardLegend } from './KanbanBoardLegend'
import { KanbanStatusRibbon } from './KanbanStatusRibbon'
import type { DueBucket } from '../../lib/dueBucket'
import { KanbanViewSwitcher, type KanbanViewMode } from './KanbanViewSwitcher'
import { AxelKanbanCard } from './AxelKanbanCard'
import { DueBucketBoard } from './DueBucketBoard'
import { AxelTaskDrawer } from './AxelTaskDrawer'
import { AxelAbsoluteFocusOverlay } from './AxelAbsoluteFocusOverlay'
import { AxelAchievementTrail } from './AxelAchievementTrail'
import { AxelFlowSuggestionButton } from './AxelFlowSuggestionButton'
import { computeDailyLoadBalancer } from '../../lib/adaptiveOrchestration'
import {
  bucketByDueDate,
  DUE_BUCKET_LABELS,
  dueBucketDropHint,
  parseDueBucketDropId,
  snapDueDateForBucket,
} from '../../lib/dueBucket'
import { deriveExecutionQueue, deriveExecutionQueueIds } from '../../lib/executionQueue'
import {
  HORIZON_LABELS,
  bucketByTemporalHorizon,
  resolveTemporalHorizon,
  type TemporalHorizon,
} from '../../lib/temporalHorizon'
import { useAxelIngestion } from '../../hooks/useAxelIngestion'
import { recordDragPreference } from '../../lib/axelDragLearning'
import {
  AXEL_KANBAN_GLOW,
  AXEL_KANBAN_PAGE,
} from '../../constants/axelKanbanTheme'
import { AXEL_BTN_PRIMARY, AXEL_MAIN_PB_MOBILE } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

// Orquestrador Temporal — colunas por horizonte (Bitrix logic)

const HORIZONS: TemporalHorizon[] = ['hoje', 'semana', 'backlog']

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
  const personalVelocityFactor = useTaskStore((s) => s.personalVelocityFactor)
  const pushAiDecision = useTaskStore((s) => s.pushAiDecision)
  const setDeadlineProposals = useTaskStore((s) => s.setDeadlineProposals)
  const hydrateDeadlineProposals = useTaskStore((s) => s.hydrateDeadlineProposals)
  const resolveLastMovedAt = useTaskStore((s) => s.resolveLastMovedAt)
  const realtimeStatus = useTaskStore((s) => s.realtimeStatus)
  const axelIngestionPolling = useTaskStore((s) => s.axelIngestionPolling)

  const { highlightIds } = useAxelIngestion({ enabled: true })

  const [ingestionTick, setIngestionTick] = useState(0)
  const prevHighlightRef = useRef<number[]>([])

  useEffect(() =>
  {
    void hydrateDeadlineProposals()
  }, [hydrateDeadlineProposals])

  useEffect(() =>
  {
    const fresh = highlightIds.filter((id) => !prevHighlightRef.current.includes(id))
    if (fresh.length > 0)
    {
      setIngestionTick((t) => t + 1)
    }
    prevHighlightRef.current = highlightIds
  }, [highlightIds])

  const baseTarefas = useMemo(
    () => mergeDashboardTasks(storeTarefas),
    [storeTarefas],
  )

  const {
    scoreOverrides,
    horizonOverrides,
    manualHorizons,
    orchestrating,
    lastRunAt,
    lastSource,
    intelligenceReady,
    autoEnabled,
    setAutoEnabled,
    metricsKey,
    runOrchestration,
    setManualHorizon,
  } = useKanbanOrchestration({
    tasks: baseTarefas,
    dailyScoreCap,
    updateTarefa,
    patchTarefaLocal,
    pushAiDecision,
    resolveLastMovedAt,
    setDeadlineProposals,
    personalVelocityFactor,
    ingestionTick,
  })

  const webhookListening =
    realtimeStatus === 'live' || axelIngestionPolling

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
  const [activeId, setActiveId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<string | number | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileBoardTab>('executar')
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
    return baseTarefas.map((t) =>
    {
      const score = scoreOverrides[t.id] ?? t.score_urgencia
      if (score === t.score_urgencia) return t
      return { ...t, score_urgencia: score }
    })
  }, [baseTarefas, scoreOverrides])

  const columns = useMemo(
    () => bucketByTemporalHorizon(tarefas, horizonOverrides),
    [tarefas, horizonOverrides],
  )

  const hojeLoadBalance = useMemo(
    () => computeDailyLoadBalancer(columns.hoje, dailyScoreCap),
    [columns.hoje, dailyScoreCap],
  )

  const hojeActiveSorted = useMemo(
    () => deriveExecutionQueue(tarefas, horizonOverrides),
    [tarefas, horizonOverrides],
  )

  const executionQueueIds = useMemo(
    () => deriveExecutionQueueIds(tarefas, horizonOverrides),
    [tarefas, horizonOverrides],
  )

  const dueBuckets = useMemo(() => bucketByDueDate(tarefas), [tarefas])

  const dueCount = useMemo(() =>
    dueBuckets.vencido.length
    + dueBuckets.hoje.length
    + dueBuckets.esta_semana.length
    + dueBuckets.proxima_semana.length
    + dueBuckets.sem_prazo.length,
  [dueBuckets])

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

  const gargalos = useMemo(() =>
  {
    const now = Date.now()
    return tarefas.filter((t) =>
    {
      if (t.status === 'concluida' || !t.data_vencimento) return false
      return new Date(t.data_vencimento).getTime() < now
    }).length
  }, [tarefas])

  const bucketParam = searchParams.get('bucket')
  const panelParam = searchParams.get('panel')
  const taskIdParam = searchParams.get('task')

  const jumpToDueBucket = useCallback((bucket: DueBucket) =>
  {
    setMobileTab('prazo')
    window.requestAnimationFrame(() =>
    {
      document.getElementById(`due-section-${bucket}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  }, [])

  useEffect(() =>
  {
    if (panelParam === 'executar')
    {
      setMobileTab('executar')
      setViewMode('board')
      return
    }

    if (!bucketParam) return

    const valid: DueBucket[] = [
      'vencido', 'hoje', 'esta_semana', 'proxima_semana', 'sem_prazo',
    ]
    if (!valid.includes(bucketParam as DueBucket)) return

    setViewMode('board')
    jumpToDueBucket(bucketParam as DueBucket)
  }, [bucketParam, panelParam, jumpToDueBucket])
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
    recordDragPreference(task.titulo, horizon)
    setManualHorizon(task.id, horizon)

    if (horizon === 'hoje')
    {
      const boosted = Math.max(task.score_urgencia ?? 0, 92)
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

    if (horizon === 'hoje')
    {
      toast.success('Priorizado em Executar agora')
    }
    else
    {
      toast.success(`Movido para ${HORIZON_LABELS[horizon]}`)
    }
  }, [horizonOverrides, updateTarefa, moveTask, recordTaskMoved, setManualHorizon])

  const moveToDueBucket = useCallback(async (task: TarefaUnificada, bucket: ReturnType<typeof parseDueBucketDropId>) =>
  {
    if (!bucket) return

    const nextDue = snapDueDateForBucket(bucket)
    const currentDue = task.data_vencimento ?? null

    if (currentDue === nextDue)
    {
      return
    }

    if (task.id > 0)
    {
      await updateTarefa(task.id, { data_vencimento: nextDue })
    }

    toast.success(`${dueBucketDropHint(bucket)} · ${DUE_BUCKET_LABELS[bucket]}`)
  }, [updateTarefa])

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
    setDragOverId(null)
  }

  const handleDragOver = (event: DragOverEvent) =>
  {
    setDragOverId(event.over?.id ?? null)
  }

  const clearDragState = () =>
  {
    setActiveId(null)
    setDragOverId(null)
  }

  const handleDragEnd = (event: DragEndEvent) =>
  {
    clearDragState()
    const { active, over } = event
    if (!over) return

    const task = tarefas.find((t) => t.id === active.id)
    if (!task) return

    const dueBucket = parseDueBucketDropId(over.id)
    if (dueBucket)
    {
      void moveToDueBucket(task, dueBucket)
      return
    }

    const target = over.id as TemporalHorizon
    if (target === 'hoje')
    {
      void moveToHorizon(task, 'hoje')
      return
    }

    if (HORIZONS.includes(target))
    {
      void moveToHorizon(task, target)
    }
  }

  const handleDragCancel = (_event: DragCancelEvent) =>
  {
    clearDragState()
  }

  const dragIntent = resolveKanbanDragIntent(dragOverId)

  const handleTaskCreated = (task: TarefaUnificada) =>
  {
    setDrawerCreating(false)
    setManualHorizon(task.id, createHorizon)
    setSearchParams({ task: String(task.id) })
  }

  const handleReorganizeAll = useCallback(async () =>
  {
    try
    {
      const result = await runOrchestration({ clearManual: true })
      if (!result) return
      toast.success(`AXEL reorganizou · ${result.hojeCount} em Hoje`, {
        description: result.source === 'mock'
          ? 'Motor local — configure IA para análise avançada'
          : 'Prioridades e horizontes recalculados',
      })
    }
    catch (err)
    {
      console.error('[KanbanView] reorganização falhou:', err)
      toast.error('Falha ao reorganizar o pipeline')
    }
  }, [runOrchestration])

  if (zenFocusActive)
  {
    return (
      <>
        <AxelAbsoluteFocusOverlay horizonOverrides={horizonOverrides} />
      </>
    )
  }

  return (
    <div className={`relative w-full h-full min-h-0 flex flex-col flex-1 min-w-0 ${AXEL_KANBAN_PAGE} ${AXEL_MAIN_PB_MOBILE}`}>
      <div className={AXEL_KANBAN_GLOW} aria-hidden />

      <div className="relative z-10 w-full flex flex-col flex-1 min-h-0">
        <div className="shrink-0 px-3 sm:px-5 lg:px-7 pt-3 sm:pt-4 pb-3 flex flex-col gap-2 sm:gap-3 max-w-[1680px] mx-auto w-full">
          <header className={`shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-line`}>
            <div>
              <h1 className="text-xl sm:text-2xl font-display tracking-tight text-ink leading-tight">
                Execução
              </h1>
              <p className="hidden sm:block text-[12px] mt-1 text-ink-muted">
                Priorize à esquerda · execute · ajuste prazos à direita
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <KanbanViewSwitcher mode={viewMode} onChange={handleViewModeChange} />
              <button
                type="button"
                onClick={() => openCreateDrawer('backlog')}
                className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide px-3 py-2 ${AXEL_BTN_PRIMARY}`}
              >
                <span className="hidden sm:inline">Nova demanda</span>
                <span className="sm:hidden">Nova</span>
              </button>
            </div>
          </header>

          {viewMode === 'board' && (
            <>
              <KanbanBoardLegend
                execCount={hojeActiveSorted.length}
                dueCount={dueCount}
              />
              <KanbanStatusRibbon
                overdue={dueBuckets.vencido.length}
                dueToday={dueBuckets.hoje.length}
                thisWeek={dueBuckets.esta_semana.length}
                noDate={dueBuckets.sem_prazo.length}
                execCount={hojeActiveSorted.length}
                onJump={jumpToDueBucket}
                onExecJump={() => setMobileTab('executar')}
              />
            </>
          )}

          {viewMode === 'board' && (dueBuckets.vencido.length > 0 || dueBuckets.hoje.length > 0) && (
            <KanbanMorningBrief
              hojeTasks={hojeActiveSorted}
              dueToday={dueBuckets.hoje.length}
              overdue={dueBuckets.vencido.length}
              dailyScoreCap={dailyScoreCap}
            />
          )}

          {viewMode === 'board' && (
            <KanbanNextStep
              executionQueue={hojeActiveSorted}
              tarefas={tarefas}
              heroTask={heroTask}
              isExecuting={heroTask != null && execution?.taskId === heroTask.id}
              orchestrating={orchestrating}
              onExecute={() =>
              {
                if (heroTask) void startTask(heroTask)
              }}
              onOpenTask={handleOpen}
              onReorganize={() => void handleReorganizeAll()}
              onPrioritizeTask={(task) => void moveToHorizon(task, 'hoje')}
            />
          )}

          <KanbanInsightsPanel
            summary={`${tarefas.filter((t) => t.status !== 'concluida').length} ativas · ${columns.hoje.length} na fila`}
          >
            <KanbanCommandBar
              key={`kanban-cmd-${metricsKey}`}
              tarefas={tarefas}
              hojeTasks={columns.hoje}
              hojeCount={columns.hoje.length}
              dailyScoreCap={dailyScoreCap}
              gargalos={gargalos}
              intelligenceOn={webhookListening}
              onRecalculate={handleReorganizeAll}
              loading={orchestrating}
            />
            <KanbanOrchestrationStatus
              autoEnabled={autoEnabled}
              orchestrating={orchestrating}
              lastRunAt={lastRunAt}
              lastSource={lastSource}
              intelligenceReady={intelligenceReady}
              manualCount={Object.keys(manualHorizons).length}
              onToggleAuto={setAutoEnabled}
              onReorganizeAll={() => void handleReorganizeAll()}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openZenFocus()}
                className="inline-flex items-center gap-1.5 border border-line text-ink-muted hover:text-accent font-mono text-[10px] uppercase tracking-wide px-2.5 py-1.5 rounded-sl transition-colors"
              >
                <Target size={12} strokeWidth={1.75} />
                Foco absoluto
              </button>
              <AxelFlowSuggestionButton
                hojeTasks={columns.hoje}
                dailyScoreCap={dailyScoreCap}
                onMoveTasks={moveTasksForFlow}
              />
            </div>
            <KanbanDecisionLog />
          </KanbanInsightsPanel>
        </div>

        <div
          className={`flex-1 min-h-0 flex flex-col px-3 sm:px-5 lg:px-7 pb-4 max-w-[1680px] mx-auto w-full transition-opacity duration-200 ${
            viewVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
        {viewMode === 'list' && (
          <AxelKanbanListView
            tarefas={tarefas}
            horizonOverrides={horizonOverrides}
            onOpen={handleOpen}
          />
        )}

        {viewMode === 'calendar' && (
          <KanbanCalendarView tarefas={tarefas} onOpen={handleOpen} />
        )}

        {viewMode === 'gantt' && (
          <div className="flex-1 min-h-0 border border-line rounded-sl bg-card overflow-auto">
            <GanttView tarefas={tarefas} onSelectTarefa={handleOpen} />
          </div>
        )}

        {viewMode === 'board' && (
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <KanbanMobileBoardShell
              execCount={hojeActiveSorted.length}
              dueCount={dueCount}
              tab={mobileTab}
              onTabChange={setMobileTab}
              onAddTask={() => openCreateDrawer('backlog')}
              executar={(
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
                  onReorganize={() => void handleReorganizeAll()}
                />
              )}
              prazo={(
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <DueBucketBoard
                    tarefas={tarefas}
                    executionQueueIds={executionQueueIds}
                    activeId={activeId}
                    onOpen={handleOpen}
                  />
                </div>
              )}
            />

            <DragOverlay dropAnimation={null}>
              {activeTask && (
                <div className="relative">
                  {dragIntent && (
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded-sl border border-accent/40 bg-accent/15 text-accent shadow-lg">
                      {dragIntent}
                    </span>
                  )}
                  <AxelKanbanCard tarefa={activeTask} allTasks={tarefas} isDragging />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
        </div>

        <AxelAchievementTrail />

        {(selectedTask || drawerCreating) && (
          <AxelTaskDrawer
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
