import { useState } from 'react'
import { CalendarClock, CheckCircle2, Pause, Pencil, Play } from 'lucide-react'
import { formatTaskRef, urgencyScoreClass } from '../../lib/kanbanVisual'
import { getProjectTag } from '../../lib/contextRationale'
import { evaluateProofOfWork, STREAK_MIN_SCORE } from '../../lib/proofOfWork'
import { calcSubtaskProgress } from '../../lib/subtaskProgress'
import { axelCompleteTask } from '../../lib/axelTaskCompletion'
import { axelExtendTaskDeadline } from '../../lib/axelTaskDeadline'
import { computeAxelFocusProgress, formatEstimateHint } from '../../lib/axelTaskEstimate'
import { useTaskStore } from '../../store/useTaskStore'
import { useLiveTaskElapsed } from '../../hooks/useLiveTaskElapsed'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Detalhe compacto da tarefa selecionada — vive dentro do painel Hoje

interface KanbanTaskDetailStripProps
{
  task: TarefaUnificada | null
  isExecuting: boolean
  onExecute: () => void
  onOpen: () => void
  compact?: boolean
}

// Janela útil do dia para uma demanda: 14h — nudge após 5h de foco contínuo
const NUDGE_FOCUS_HOURS = 5
const NUDGE_MIN_SECONDS = NUDGE_FOCUS_HOURS * 60 * 60

function focusNudgeActive(elapsed: number, isExecuting: boolean): boolean
{
  if (!isExecuting) return false
  return elapsed >= NUDGE_MIN_SECONDS
}

function FocusProgressBar({
  progress,
  estimateMinutes,
}: {
  progress: number
  estimateMinutes: number
})
{
  const pct = Math.round(progress * 100)
  return (
    <div className="mt-1.5 space-y-0.5">
      <div
        className="h-1 rounded-full bg-chrome overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso do foco"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="font-mono text-[9px] tabular-nums text-accent">
        AXEL · {pct}% · {formatEstimateHint(estimateMinutes)}
      </p>
    </div>
  )
}

export function KanbanTaskDetailStrip({
  task,
  isExecuting,
  onExecute,
  onOpen,
  compact = false,
}: KanbanTaskDetailStripProps)
{
  const stopExecution = useTaskStore((s) => s.stopExecution)
  const taskId = task?.id ?? 0
  const estimateMinutes = useTaskStore((s) => (task ? s.taskEstimates[task.id] ?? 45 : 45))
  const elapsed = useLiveTaskElapsed(task?.id ?? null, isExecuting)
  const [extending, setExtending] = useState(false)

  if (!task)
  {
    return null
  }

  const score = task.score_urgencia ?? 0
  const reason = task.urgency_reason ?? task.score_reason
  const subs = task.subtarefas ?? []
  const subPct = subs.length > 0 ? calcSubtaskProgress(subs) : null
  const proof = evaluateProofOfWork(score, elapsed, estimateMinutes)
  const focusProgress = isExecuting
    ? computeAxelFocusProgress(elapsed, estimateMinutes, task)
    : 0
  const nudge = focusNudgeActive(elapsed, isExecuting)

  const toggleFocus = () =>
  {
    if (isExecuting)
    {
      stopExecution()
      return
    }
    onExecute()
  }

  const handleComplete = () =>
  {
    stopExecution()
    void axelCompleteTask(task)
  }

  const handleDifficulty = () =>
  {
    if (extending) return
    setExtending(true)
    void axelExtendTaskDeadline(task).finally(() => setExtending(false))
  }

  if (compact)
  {
    return (
      <div className="shrink-0 border-t border-line px-2.5 py-2 bg-chrome/40">
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-ink leading-snug line-clamp-1">
              {cleanTitleForDisplay(task.titulo)}
            </p>
            <p className={`font-mono text-[9px] tabular-nums text-zinc-500 ${urgencyScoreClass(score)}`}>
              Urgência {score}
            </p>
            {isExecuting && (
              <FocusProgressBar progress={focusProgress} estimateMinutes={estimateMinutes} />
            )}
            {nudge && (
              <p className="text-[9px] text-atencao mt-1 leading-snug">
                Foco há {NUDGE_FOCUS_HOURS}h+ — concluiu ou precisa de mais prazo?
              </p>
            )}
          </div>
          {nudge && (
            <button
              type="button"
              onClick={handleDifficulty}
              disabled={extending}
              className="inline-flex items-center justify-center min-w-[2.75rem] px-1.5 py-2 rounded-md border border-atencao/40 text-atencao hover:bg-atencao/10 shrink-0 transition-colors disabled:opacity-50"
              aria-label="Estou com dificuldade — pedir mais prazo"
              title="Preciso de mais prazo"
            >
              <CalendarClock size={14} strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={handleComplete}
            className={`inline-flex items-center justify-center min-w-[2.75rem] px-2 py-2 rounded-md border border-concluido/40 text-concluido hover:bg-concluido/10 shrink-0 transition-colors ${
              nudge ? 'animate-axel-nudge-complete' : ''
            }`}
            aria-label="Concluir tarefa"
            title={nudge ? 'Concluir — foco ativo há um tempo' : 'Concluir'}
          >
            <CheckCircle2 size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={toggleFocus}
            className={`inline-flex items-center justify-center gap-1 min-w-[2.75rem] px-2.5 py-2 font-mono text-[9px] uppercase tracking-wide shrink-0 ${AXEL_BTN_PRIMARY}`}
            aria-label={isExecuting ? 'Pausar foco' : 'Iniciar foco'}
          >
            {isExecuting ? (
              <Pause size={11} strokeWidth={1.75} fill="currentColor" />
            ) : (
              <Play size={11} strokeWidth={1.75} fill="currentColor" />
            )}
            <span className="sr-only">{isExecuting ? 'Pausar' : 'Focar'}</span>
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center justify-center min-w-[2.75rem] px-2 py-2 border border-line text-zinc-500 hover:text-ink rounded-md shrink-0 transition-colors"
            aria-label="Editar demanda"
            title="Editar demanda"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="shrink-0 border-t border-line px-4 py-3 bg-chrome/40">
      <p className="font-sans text-[15px] font-medium text-ink leading-snug line-clamp-2">
        {cleanTitleForDisplay(task.titulo)}
      </p>
      <p className="font-mono text-[10px] text-zinc-500 mt-1.5 flex flex-wrap gap-x-1.5">
        <span>{formatTaskRef(taskId)}</span>
        <span>·</span>
        <span>{getProjectTag(task)}</span>
        <span>·</span>
        <span className={urgencyScoreClass(score)}>Urgência {score}</span>
      </p>
      {reason && (
        <p className="text-[12px] text-zinc-500 mt-2 line-clamp-2 leading-relaxed">
          {reason}
        </p>
      )}
      {isExecuting && (
        <FocusProgressBar progress={focusProgress} estimateMinutes={estimateMinutes} />
      )}
      {(subPct != null || isExecuting) && (
        <p className="font-mono text-[10px] text-zinc-500 mt-2">
          {subPct != null && <span>Checklist {subPct}%</span>}
          {subPct != null && isExecuting && <span> · </span>}
          {isExecuting && (
            <span className={proof.qualifiesForStreak ? 'text-concluido' : 'text-atencao'}>
              Foco {proof.focusMinutesOnTask}m
              {score > STREAK_MIN_SCORE ? '' : ` · score abaixo de ${STREAK_MIN_SCORE}`}
            </span>
          )}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {nudge && (
          <button
            type="button"
            onClick={handleDifficulty}
            disabled={extending}
            className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wide border border-atencao/40 text-atencao hover:bg-atencao/10 rounded-md transition-colors disabled:opacity-50"
          >
            <CalendarClock size={12} strokeWidth={1.75} />
            Mais prazo
          </button>
        )}
        <button
          type="button"
          onClick={handleComplete}
          className={`inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wide border border-concluido/40 text-concluido hover:bg-concluido/10 rounded-md transition-colors ${
            nudge ? 'animate-axel-nudge-complete' : ''
          }`}
        >
          <CheckCircle2 size={12} strokeWidth={1.75} />
          Concluir
        </button>
        <button
          type="button"
          onClick={toggleFocus}
          className={`inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
        >
          {isExecuting ? (
            <Pause size={12} strokeWidth={1.75} fill="currentColor" />
          ) : (
            <Play size={12} strokeWidth={1.75} fill="currentColor" />
          )}
          {isExecuting ? 'Pausar' : 'Executar'}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wide border border-line text-zinc-500 hover:text-ink rounded-md transition-colors"
        >
          <Pencil size={12} strokeWidth={1.75} />
          Editar
        </button>
      </div>
    </div>
  )
}
