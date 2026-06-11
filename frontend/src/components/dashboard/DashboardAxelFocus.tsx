import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Play, Sparkles } from 'lucide-react'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { useTaskStore } from '../../store/useTaskStore'
import { MAIN_QUEST_XP_BONUS_RATIO, syncMainQuest } from '../../lib/mainQuest'
import { cleanTitleForDisplay } from '../kanban/axelKanbanUtils'
import { formatTaskRef, urgencyScoreClass } from '../../lib/kanbanVisual'
import {
  AXEL_BTN_PRIMARY,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Main Quest — card compacto, 1 linha de decisão + CTA

interface DashboardAxelFocusProps
{
  onOpenTask?: (taskId: number) => void
  onExecuteTask?: (taskId: number) => void
}

export function DashboardAxelFocus({ onOpenTask, onExecuteTask }: DashboardAxelFocusProps)
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)

  const { topTask, bonusXp } = useMemo(() =>
  {
    const tasks = mergeDashboardTasks(storeTarefas).filter((t) => t.status !== 'concluida')
    const main = syncMainQuest(tasks)
    const base = main?.score_urgencia ?? 0
    const bonus = base > 0 ? Math.round(base * MAIN_QUEST_XP_BONUS_RATIO) : 0
    return { topTask: main, bonusXp: bonus }
  }, [storeTarefas])

  const title = topTask ? cleanTitleForDisplay(topTask.titulo) : null

  return (
    <section
      className="rounded-sl bg-card border border-line border-l-[3px] border-l-accent p-3 sm:p-4"
      aria-labelledby="axel-focus-heading"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 id="axel-focus-heading" className={AXEL_SECTION_TITLE}>
              Main Quest
            </h2>
            {topTask && bonusXp > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-sl border border-accent/35 bg-accent/10 text-accent">
                <Sparkles size={9} />
                +{bonusXp} XP
              </span>
            )}
          </div>

          {topTask ? (
            <>
              <button
                type="button"
                onClick={() => onOpenTask?.(topTask.id)}
                className={`group flex items-center gap-1.5 text-left w-full min-w-0 ${AXEL_TEXT_PRIMARY}`}
              >
                <span className="font-display text-[15px] sm:text-base leading-snug truncate group-hover:text-accent transition-colors">
                  {title}
                </span>
                <ChevronRight size={14} className="shrink-0 text-ink-muted group-hover:text-accent" />
              </button>
              <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 font-mono text-[10px] ${AXEL_TEXT_SECONDARY}`}>
                <span>{formatTaskRef(topTask.id)}</span>
                <span aria-hidden>·</span>
                <span className={urgencyScoreClass(topTask.score_urgencia ?? 0)}>
                  {topTask.score_urgencia ?? 0} pts
                </span>
              </div>
            </>
          ) : (
            <p className={`text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              Sem demandas ativas — abra o Kanban para planejar.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
          {
            if (topTask && onExecuteTask)
            {
              onExecuteTask(topTask.id)
              return
            }
            navigate('/kanban')
          }}
          className={`shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wide px-4 py-2.5 sm:py-2 ${AXEL_BTN_PRIMARY}`}
        >
          <Play size={12} strokeWidth={1.75} fill="currentColor" />
          {topTask ? 'Executar' : 'Kanban'}
        </button>
      </div>
    </section>
  )
}
