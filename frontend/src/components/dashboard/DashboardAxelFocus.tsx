import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { useMoodOrchestration } from '../../hooks/useMoodOrchestration'
import { useStartTaskExecution } from '../../hooks/useStartTaskExecution'
import { syncMainQuest } from '../../lib/mainQuest'
import { cleanTitleForDisplay } from '../kanban/axelKanbanUtils'
import {
  AXEL_BTN_MD,
  AXEL_BTN_PRIMARY,
  AXEL_BTN_EXECUTE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

interface DashboardAxelFocusProps
{
  onOpenTask?: (taskId: number) => void
  embedded?: boolean
}

export function DashboardAxelFocus({ onOpenTask, embedded = false }: DashboardAxelFocusProps)
{
  const navigate = useNavigate()
  const { startTask } = useStartTaskExecution()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const mood = useMoodOrchestration()
  const getAdjustedEstimateMinutes = useTaskStore((s) => s.getAdjustedEstimateMinutes)
  const pomodoroTime = useTaskStore((s) => s.timerConfig.pomodoroTime)

  const { topTask } = useMemo(() =>
  {
    const tasks = storeTarefas.filter((t) => t.status !== 'concluida')
    const main = syncMainQuest(tasks, mood)
    return { topTask: main }
  }, [storeTarefas, mood])

  const title = topTask ? cleanTitleForDisplay(topTask.titulo) : null
  const estimateMin = topTask
    ? getAdjustedEstimateMinutes(topTask.id, topTask.titulo)
    : 0
  const pomodoroBlocks = topTask
    ? Math.max(1, Math.ceil(estimateMin / Math.max(1, pomodoroTime)))
    : 0

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
    <div className={`flex items-center gap-3 ${embedded ? 'pt-0 mt-0' : 'pt-3 mt-3 border-t border-line/80'}`}>
      <div className="min-w-0 flex-1">
        <p className="sl-section-label">
          Agora
        </p>
        {topTask ? (
          <button
            type="button"
            onClick={() => onOpenTask?.(topTask.id)}
            className={`text-left w-full min-w-0 mt-0.5 min-h-[44px] ${AXEL_TEXT_PRIMARY}`}
          >
            <span className="sl-body font-medium leading-snug line-clamp-2">
              {title}
            </span>
            <span className={`block mt-0.5 text-[12px] ${AXEL_TEXT_SECONDARY}`}>
              {pomodoroBlocks} bloco{pomodoroBlocks === 1 ? '' : 's'} de {pomodoroTime} min
              {' · '}~{estimateMin} min
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
        className={`shrink-0 gap-1.5 ${AXEL_BTN_MD} ${topTask ? AXEL_BTN_EXECUTE : AXEL_BTN_PRIMARY}`}
      >
        <Play size={11} strokeWidth={1.75} fill="currentColor" />
        {topTask ? 'Executar' : 'Kanban'}
      </button>
    </div>
  )
}
