import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { useTaskStore } from '../../store/useTaskStore'
import { buildMorningBrief } from '../../lib/morningBrief'
import { cleanTitleForDisplay } from '../kanban/axelKanbanUtils'
import { urgencyScoreClass } from '../../lib/kanbanVisual'
import {
  AXEL_BORDERLESS_PANEL,
  AXEL_BTN_PRIMARY,
  AXEL_SECTION_TITLE,
  AXEL_TEXT_PRIMARY,
  AXEL_TEXT_SECONDARY,
} from '../../constants/axelSurfaces'

// Comando do dia — uma ação, não um painel de RPG

export function DashboardAxelFocus()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const dailyScoreCap = useTaskStore((s) => s.dailyScoreCap)

  const { topTask, hojeTasks, brief } = useMemo(() =>
  {
    const tasks = mergeDashboardTasks(storeTarefas).filter((t) => t.status !== 'concluida')
    const sorted = [...tasks].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
    const hoje = sorted.filter((t) => (t.score_urgencia ?? 0) >= 70)
    const top = sorted[0] ?? null
    const morning = buildMorningBrief(hoje.length > 0 ? hoje : sorted.slice(0, 5), dailyScoreCap)
    return { topTask: top, hojeTasks: hoje, brief: morning }
  }, [storeTarefas, dailyScoreCap])

  const reason = topTask?.urgency_reason ?? topTask?.score_reason

  return (
    <section className={`${AXEL_BORDERLESS_PANEL} flex flex-col h-full`} aria-labelledby="axel-focus-heading">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-accent mb-2">
        AXEL · Apoio · Execução · Log
      </p>
      <h2 id="axel-focus-heading" className={`${AXEL_SECTION_TITLE} mb-3`}>
        Seu próximo passo
      </h2>

      <p className={`text-[13px] leading-relaxed ${AXEL_TEXT_PRIMARY}`}>
        {brief.headline}
      </p>
      <p className={`text-[11px] mt-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
        {brief.detail}
      </p>

      {topTask ? (
        <div className="mt-4 p-3 rounded-sl border border-line bg-chrome/30">
          <p className={`text-[14px] font-display leading-snug line-clamp-2 ${AXEL_TEXT_PRIMARY}`}>
            {cleanTitleForDisplay(topTask.titulo)}
          </p>
          <p className={`font-mono text-[10px] mt-2 tabular-nums ${urgencyScoreClass(topTask.score_urgencia ?? 0)}`}>
            {topTask.score_urgencia ?? 0} pts
            {hojeTasks.length > 0 && (
              <span className={`ml-2 ${AXEL_TEXT_SECONDARY}`}>
                · {hojeTasks.length} em foco hoje
              </span>
            )}
          </p>
          {reason && (
            <p className={`text-[11px] mt-2 line-clamp-2 leading-relaxed ${AXEL_TEXT_SECONDARY}`}>
              {reason}
            </p>
          )}
        </div>
      ) : (
        <p className={`text-[12px] mt-4 ${AXEL_TEXT_SECONDARY}`}>
          Nenhuma demanda ativa — abra o Kanban para planejar.
        </p>
      )}

      <div className="mt-auto pt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate('/kanban')}
          className={`inline-flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-wide py-2.5 ${AXEL_BTN_PRIMARY}`}
        >
          <Play size={12} strokeWidth={1.75} fill="currentColor" />
          {topTask ? 'Executar no Kanban' : 'Abrir Centro de Execução'}
        </button>
        <button
          type="button"
          onClick={() => navigate('/perfil')}
          className={`inline-flex items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-wide py-2 text-ink-muted hover:text-accent transition-colors`}
        >
          Ofensiva &amp; XP no perfil
          <ArrowRight size={12} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  )
}
