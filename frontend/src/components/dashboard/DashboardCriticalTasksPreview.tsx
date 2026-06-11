import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Zap } from 'lucide-react'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { useTaskStore } from '../../store/useTaskStore'
import { urgencyBadgeClass } from '../../lib/urgencyEngine'
import {
  AXEL_LINK,
  AXEL_ROW_HOVER,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'
import { DashboardPanel, DashboardPanelLink } from './DashboardPanel'

const PREVIEW_LIMIT = 5

export function DashboardCriticalTasksPreview()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)

  const topTasks = useMemo(() =>
  {
    return mergeDashboardTasks(storeTarefas)
      .filter((t) => t.status !== 'concluida')
      .sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
      .slice(0, PREVIEW_LIMIT)
  }, [storeTarefas])

  if (topTasks.length === 0)
  {
    return null
  }

  return (
    <DashboardPanel
      section="01"
      title="Execução"
      subtitle={`Top ${PREVIEW_LIMIT} · motor de urgência`}
      action={<DashboardPanelLink label="Kanban →" onClick={() => navigate('/kanban')} />}
      noPadding
      className="h-full"
    >
      <ul className="divide-y divide-line">
        {topTasks.map((t, idx) =>
        {
          const score = t.score_urgencia ?? 0
          const tag = t.labels?.[0]?.nome?.toUpperCase()

          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => navigate('/kanban')}
                className={`w-full flex items-center gap-3 py-3 px-4 text-left ${AXEL_ROW_HOVER}`}
              >
                <span className={`font-mono text-[11px] tabular-nums w-6 shrink-0 ${AXEL_TEXT_SECONDARY}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className={`flex-1 min-w-0 text-[13px] truncate ${AXEL_TEXT_PRIMARY}`}>
                  {t.titulo}
                </span>
                {tag && (
                  <span className={`hidden md:inline font-mono text-[9px] uppercase tracking-wider shrink-0 ${AXEL_TEXT_SECONDARY}`}>
                    {tag}
                  </span>
                )}
                <span className={`inline-flex items-center gap-0.5 font-mono text-[11px] tabular-nums shrink-0 ${urgencyBadgeClass(score)}`}>
                  <Zap className="w-3 h-3" strokeWidth={2} />
                  {score}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${AXEL_LINK}`} />
              </button>
            </li>
          )
        })}
      </ul>
    </DashboardPanel>
  )
}
