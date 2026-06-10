import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Circle, Pause, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { useLocalSubtasks } from '../../hooks/useLocalSubtasks'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { orionCompleteTask } from '../../lib/orionTaskCompletion'
import {
  bucketByTemporalHorizon,
  type TemporalHorizon,
} from '../../lib/temporalHorizon'
import { cleanTitleForDisplay } from './orionKanbanUtils'
import { getProjectTag } from '../../lib/contextRationale'
import { ZenFocusProgressRing } from './ZenFocusProgressRing'
import type { TarefaUnificada } from '../../types'

// Modo Foco Absoluto — ambiente calmo, timer silencioso, controle empático

const ZEN_REASSURANCE =
  'Foque apenas nisso agora. O resto do sistema está cuidando de si mesmo.'

const BREATHE_MESSAGE = 'Tudo bem, o contexto está salvo. Volte quando quiser.'

interface OrionAbsoluteFocusOverlayProps
{
  horizonOverrides: Record<number, TemporalHorizon>
}

function pickTopHojeTask(
  tarefas: TarefaUnificada[],
  horizonOverrides: Record<number, TemporalHorizon>,
  excludeId?: number | null,
): TarefaUnificada | null
{
  const buckets = bucketByTemporalHorizon(tarefas, horizonOverrides)
  const hoje = buckets.hoje
    .filter((t) => t.status !== 'concluida' && t.id !== excludeId)
    .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))

  return hoje[0] ?? null
}

function approxMinutesRemaining(estimateMinutes: number, elapsedSeconds: number): number
{
  const totalSec = estimateMinutes * 60
  const left = Math.max(0, totalSec - elapsedSeconds)
  return Math.max(1, Math.ceil(left / 60))
}

export function OrionAbsoluteFocusOverlay({
  horizonOverrides,
}: OrionAbsoluteFocusOverlayProps)
{
  const zenFocusActive = useTaskStore((s) => s.zenFocusActive)
  const zenFocusTaskId = useTaskStore((s) => s.zenFocusTaskId)
  const setZenFocusActive = useTaskStore((s) => s.setZenFocusActive)
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const colorScheme = useTaskStore((s) => s.accessibility.colorScheme)

  const execution = useTaskStore((s) => s.execution)
  const startExecution = useTaskStore((s) => s.startExecution)
  const stopExecution = useTaskStore((s) => s.stopExecution)
  const getTaskElapsedSeconds = useTaskStore((s) => s.getTaskElapsedSeconds)
  const taskEstimates = useTaskStore((s) => s.taskEstimates)

  const [breathing, setBreathing] = useState(false)
  const [minuteTick, setMinuteTick] = useState(0)

  const tarefas = useMemo(
    () => mergeDashboardTasks(storeTarefas),
    [storeTarefas],
  )

  const focusTask = useMemo(() =>
  {
    if (!zenFocusActive) return null
    if (zenFocusTaskId != null)
    {
      const pinned = tarefas.find((t) => t.id === zenFocusTaskId)
      if (pinned && pinned.status !== 'concluida') return pinned
    }
    return pickTopHojeTask(tarefas, horizonOverrides, null)
  }, [zenFocusActive, zenFocusTaskId, tarefas, horizonOverrides])

  const live = useTaskStore((s) =>
  {
    if (!focusTask) return null
    return s.tarefas.find((t) => t.id === focusTask.id) ?? focusTask
  })

  const serverSubs = live?.subtarefas ?? focusTask?.subtarefas ?? []
  const taskId = focusTask?.id ?? -1
  const { subs, toggleSub } = useLocalSubtasks(taskId, serverSubs)

  const isActive = execution?.taskId === taskId && !breathing

  useEffect(() =>
  {
    if (!zenFocusActive || !isActive) return
    const id = window.setInterval(() => setMinuteTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [zenFocusActive, isActive])

  void minuteTick

  useEffect(() =>
  {
    if (!zenFocusActive) setBreathing(false)
  }, [zenFocusActive])

  if (!zenFocusActive) return null

  const estimate = taskEstimates[taskId] ?? 45
  const elapsed = focusTask ? getTaskElapsedSeconds(focusTask.id) : 0
  const progress = estimate > 0 ? elapsed / (estimate * 60) : 0
  const minutesLabel = isActive
    ? `Aprox. ${approxMinutesRemaining(estimate, elapsed)} min`
    : `Aprox. ${estimate} min`

  function handleBreathe()
  {
    stopExecution()
    setBreathing(true)
    toast(BREATHE_MESSAGE, {
      duration: 5000,
      className: 'text-sm',
    })
  }

  function handleResume()
  {
    if (!focusTask) return
    setBreathing(false)
    startExecution(focusTask.id, estimate)
  }

  async function handleComplete()
  {
    if (!live) return
    stopExecution()
    setBreathing(false)
    await orionCompleteTask({ ...live, subtarefas: subs })
    const next = pickTopHojeTask(tarefas, horizonOverrides, live.id)
    if (next)
    {
      setZenFocusActive(true, next.id)
      toast('Próximo passo pronto, no seu ritmo.', { className: 'text-sm' })
    }
    else
    {
      setZenFocusActive(false)
      toast('Você pode respirar. A fila de hoje está em paz.', { className: 'text-sm' })
    }
  }

  const isDark = colorScheme === 'dark'

  return (
    <div
      className={`fixed inset-0 z-[500] flex items-center justify-center p-6 sm:p-10 ${
        isDark
          ? 'bg-gradient-to-br from-[#1A1A24] to-[#22222E]'
          : 'bg-gradient-to-br from-zinc-50 to-zinc-100'
      }`}
      role="dialog"
      aria-modal
      aria-label="Modo Foco Absoluto"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
        aria-hidden
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      <button
        type="button"
        onClick={() => setZenFocusActive(false)}
        className="absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
        title="Voltar ao Kanban (Esc)"
      >
        <ArrowLeft size={16} strokeWidth={1.5} aria-hidden />
        Voltar ao Kanban
      </button>

      {!focusTask ? (
        <div className="relative text-center max-w-md">
          <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
            Nada urgente em Hoje
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
            Quando quiser, escolha uma demanda no quadro. Sem pressa.
          </p>
          <button
            type="button"
            onClick={() => setZenFocusActive(false)}
            className="mt-8 px-5 py-2.5 rounded-full text-sm text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors"
          >
            Voltar ao Kanban
          </button>
        </div>
      ) : breathing ? (
        <div className="relative w-full max-w-lg text-center px-8 py-14 rounded-3xl border border-zinc-200/80 dark:border-white/[0.06] bg-white/90 dark:bg-[#1E1E28]/95 shadow-2xl shadow-indigo-500/5 backdrop-blur-sm">
          <p className="text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            {BREATHE_MESSAGE}
          </p>
          <button
            type="button"
            onClick={handleResume}
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/25 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
          >
            <Play size={16} strokeWidth={1.5} />
            Retomar quando estiver pronto
          </button>
        </div>
      ) : (
        <article className="relative w-full max-w-xl rounded-3xl border border-zinc-200/80 dark:border-white/[0.06] bg-white dark:bg-[#1E1E28] px-10 py-12 sm:px-12 sm:py-14 shadow-2xl shadow-indigo-500/5 flex flex-col gap-8">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed text-center max-w-md mx-auto">
            {ZEN_REASSURANCE}
          </p>

          <div className="flex flex-col items-center gap-6">
            <ZenFocusProgressRing progress={progress} size={132}>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Circle
                  size={28}
                  strokeWidth={1.25}
                  className="text-indigo-400/80 dark:text-indigo-300/70"
                />
              </div>
            </ZenFocusProgressRing>

            <p className="text-sm text-zinc-500 dark:text-zinc-400 tabular-nums">
              {minutesLabel}
            </p>
          </div>

          <div className="space-y-3 text-center">
            <span className="inline-block text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-white/[0.06]">
              {getProjectTag(focusTask)}
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-zinc-800 dark:text-zinc-100 leading-snug">
              {cleanTitleForDisplay(focusTask.titulo)}
            </h2>
          </div>

          {!isActive && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleResume}
                className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
              >
                <Play size={14} strokeWidth={1.5} />
                Começar quando se sentir pronto
              </button>
            </div>
          )}

          {subs.length > 0 && (
            <ul className="space-y-2 border-t border-zinc-100 dark:border-white/[0.04] pt-6 max-h-36 overflow-y-auto">
              {subs.map((sub) => (
                <li key={sub.id}>
                  <label className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sub.concluida}
                      onChange={() => toggleSub(sub.id)}
                      className="rounded border-zinc-300 dark:border-zinc-600"
                    />
                    <span className={sub.concluida ? 'line-through text-zinc-400' : ''}>
                      {sub.titulo}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isActive && (
              <button
                type="button"
                onClick={handleBreathe}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600/50 hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                <Pause size={16} strokeWidth={1.5} />
                Pausar e Respirar
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleComplete()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-indigo-700 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-500/15 hover:bg-indigo-100 dark:hover:bg-indigo-500/25 border border-indigo-100 dark:border-indigo-500/20 transition-colors"
            >
              <Check size={16} strokeWidth={1.75} />
              Concluí esta etapa
            </button>
          </div>
        </article>
      )}
    </div>
  )
}
