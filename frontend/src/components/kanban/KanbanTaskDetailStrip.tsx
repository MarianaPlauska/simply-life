import { Play } from 'lucide-react'
import { formatTaskRef, urgencyScoreClass } from '../../lib/kanbanVisual'
import { getProjectTag } from '../../lib/contextRationale'
import { evaluateProofOfWork, STREAK_MIN_SCORE } from '../../lib/proofOfWork'
import { calcSubtaskProgress } from '../../lib/subtaskProgress'
import { useTaskStore } from '../../store/useTaskStore'
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
}

export function KanbanTaskDetailStrip({
  task,
  isExecuting,
  onExecute,
  onOpen,
}: KanbanTaskDetailStripProps)
{
  if (!task)
  {
    return (
      <div className="shrink-0 border-t border-line px-4 py-4 bg-chrome/30">
        <p className="font-mono text-[11px] text-ink-muted leading-relaxed">
          Selecione uma demanda na fila ou arraste do planejamento para Hoje.
        </p>
      </div>
    )
  }

  const score = task.score_urgencia ?? 0
  const reason = task.urgency_reason ?? task.score_reason
  const subs = task.subtarefas ?? []
  const subPct = subs.length > 0 ? calcSubtaskProgress(subs) : null
  const elapsed = useTaskStore((s) => s.taskElapsedSeconds[task.id] ?? 0)
  const proof = evaluateProofOfWork(score, elapsed, 45)

  return (
    <div className="shrink-0 border-t border-line px-4 py-3 bg-chrome/30">
      <p className="font-display text-[15px] text-ink leading-snug line-clamp-2">
        {cleanTitleForDisplay(task.titulo)}
      </p>
      <p className="font-mono text-[10px] text-ink-muted mt-1.5 flex flex-wrap gap-x-1.5">
        <span>{formatTaskRef(task.id)}</span>
        <span>·</span>
        <span>{getProjectTag(task)}</span>
        <span>·</span>
        <span className={urgencyScoreClass(score)}>{score} pts</span>
      </p>
      {reason && (
        <p className="text-[12px] text-ink-muted mt-2 line-clamp-2 leading-relaxed">
          {reason}
        </p>
      )}
      {(subPct != null || isExecuting) && (
        <p className="font-mono text-[10px] text-ink-muted mt-2">
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
        <button
          type="button"
          onClick={onExecute}
          disabled={isExecuting}
          className={`inline-flex items-center gap-1.5 px-3 py-2 font-mono text-[10px] uppercase tracking-wide ${AXEL_BTN_PRIMARY}`}
        >
          <Play size={12} strokeWidth={1.75} fill="currentColor" />
          {isExecuting ? 'Em execução' : 'Executar'}
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-wide border border-line text-ink-muted hover:text-accent hover:border-accent/40 rounded-sl transition-colors"
        >
          Detalhes
        </button>
      </div>
    </div>
  )
}
