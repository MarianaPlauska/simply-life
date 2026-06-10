import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import {
  ORION_SOFT_CARD,
  ORION_SECTION_TITLE,
  ORION_TOUCH_ROW,
} from '../../constants/orionSurfaces'
import { useTaskStore } from '../../store/useTaskStore'
import { TaskLineRow } from '../kanban/TaskLineRow'

// Linha de execução — mobile-first, soft card, touch targets 44px

const TOP_N = 3

export function ExecutiveTopTasks()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)

  const topTasks = useMemo(() =>
  {
    return mergeDashboardTasks(storeTarefas)
      .filter((t) => t.status !== 'concluida')
      .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
      .slice(0, TOP_N)
  }, [storeTarefas])

  return (
    <section aria-labelledby="executive-top-tasks" className={ORION_SOFT_CARD}>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 id="executive-top-tasks" className={`${ORION_SECTION_TITLE} mb-2`}>
            Linha de execução
          </h2>
          <p className="text-lg sm:text-[22px] font-semibold tracking-tighter text-zinc-100 leading-none">
            Prioridades
            <span className="ml-2 text-zinc-600 font-medium text-base tabular-nums">{topTasks.length}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/kanban')}
          className={`flex items-center gap-1 text-[12px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors ${ORION_TOUCH_ROW} px-2 -my-3`}
        >
          Kanban
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div role="list">
        {topTasks.length === 0 ? (
          <p className={`${ORION_TOUCH_ROW} text-[13px] text-zinc-500 tracking-tight`}>
            Nenhuma tarefa pendente no radar.
          </p>
        ) : (
          topTasks.map((t) => (
            <TaskLineRow
              key={t.id}
              tarefa={t}
              dense
              borderless
              rich
              onOpen={() => navigate(`/kanban?task=${t.id}`)}
            />
          ))
        )}
      </div>
    </section>
  )
}
