import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { syncMainQuest } from '../../lib/mainQuest'
import { cleanTitleForDisplay } from '../kanban/axelKanbanUtils'
import {
  AXEL_BTN_PRIMARY_COMPACT,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface DashboardAxelFocusProps
{
  onOpenTask?: (taskId: number) => void
}

export function DashboardAxelFocus({ onOpenTask }: DashboardAxelFocusProps)
{
  const navigate = useNavigate()
  const { startTask } = useStartTaskExecution()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const mood = useMoodOrchestration()

  const { topTask } = useMemo(() =>
  {
    const tasks = storeTarefas.filter((t) => t.status !== 'concluida')
    const main = syncMainQuest(tasks, mood)
    return { topTask: main }
  }, [storeTarefas, mood])

  const title = topTask ? cleanTitleForDisplay(topTask.titulo) : null

  const execute = useCallback(async () =>
  {
    if (!topTask)
    {
      navigate('/kanban')
      return
    }
    await startTask(topTask)
    navigate(`/kanban?foco=${topTask.id}`)
  }, [navigate, startTask, topTask])

  return (
    <div className="flex items-center gap-2 pt-2.5 mt-2.5 border-t border-line">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium text-ink-muted">
          Agora
        </p>
        {topTask ? (
          <button
            type="button"
            onClick={() => onOpenTask?.(topTask.id)}
            className={`text-left w-full min-w-0 mt-0.5 min-h-[44px] ${AXEL_TEXT_PRIMARY}`}
          >
            <span className="font-display text-[15px] leading-snug line-clamp-2">
              {title}
            </span>
          </button>
        ) : (
          <p className={`text-[13px] mt-0.5 ${AXEL_TEXT_SECONDARY}`}>
            Sem demandas ativas. Capture pelo + ou abra o Kanban.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => void execute()}
        className={`shrink-0 inline-flex items-center justify-center gap-1.5 min-h-11 px-3 ${AXEL_BTN_PRIMARY_COMPACT}`}
      >
        <Play size={11} strokeWidth={1.75} fill="currentColor" />
        {topTask ? 'Executar' : 'Kanban'}
      </button>
    </div>
  )
}
