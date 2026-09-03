import { useNavigate } from 'react-router-dom'
import { CalendarDays, ChevronRight, KanbanSquare } from 'lucide-react'
import { DashboardAxelFocus } from './DashboardAxelFocus'
import { DashboardQuickWidget } from './DashboardQuickWidget'
import type { DashboardMobilePriority } from '../../lib/dashboardMobilePriority'
import type { listTarefasAtrasadas } from '../../lib/notificacaoUtils'
import { AXEL_BTN_MD, AXEL_BTN_PRIMARY, AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

interface DashboardMobilePriorityCardProps
{
  priority: DashboardMobilePriority
  overdueList: ReturnType<typeof listTarefasAtrasadas>
  onOpenTask?: (taskId: number) => void
}

export function DashboardMobilePriorityCard({
  priority,
  overdueList,
  onOpenTask,
}: DashboardMobilePriorityCardProps)
{
  const navigate = useNavigate()

  if (priority === 'humor')
  {
    return (
      <section
        id="dashboard-wellbeing"
        className="scroll-mt-20 min-w-0 rounded-sl border border-line/80 bg-chrome/30 px-3 py-3"
        aria-label="Humor de hoje"
      >
        <DashboardQuickWidget id="wellbeing" />
      </section>
    )
  }

  if (priority === 'vencido')
  {
    const preview = overdueList[0]?.task.titulo ?? 'Tarefa'
    const extra = overdueList.length > 1 ? ` (+${overdueList.length - 1})` : ''

    return (
      <section
        className="rounded-sl border border-urgente/25 bg-urgente/5 px-3 py-3"
        aria-label="Itens passados da data"
      >
        <div className="flex items-start gap-2.5">
          <CalendarDays className="w-5 h-5 text-urgente shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="sl-section-label text-urgente">
              Passou da data
            </p>
            <p className={`mt-1 sl-body font-semibold ${AXEL_TEXT_PRIMARY}`}>
              {overdueList.length} item{overdueList.length !== 1 ? 's' : ''} aguardando
            </p>
            <p className={`mt-0.5 text-[13px] truncate ${AXEL_TEXT_SECONDARY}`}>
              {preview}{extra}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/kanban?bucket=vencido')}
          className={`mt-3 w-full gap-1.5 ${AXEL_BTN_MD} ${AXEL_BTN_PRIMARY}`}
        >
          Ver no Kanban
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </section>
    )
  }

  if (priority === 'agora')
  {
    return (
      <section
        className="rounded-sl border border-line/80 bg-chrome/30 px-3 py-3"
        aria-label="Foco agora"
      >
        <DashboardAxelFocus onOpenTask={onOpenTask} embedded />
      </section>
    )
  }

  return (
    <section
      className="rounded-sl border border-line/80 bg-chrome/20 px-3 py-3"
      aria-label="Próximo passo"
    >
      <p className="sl-body-muted leading-relaxed">
        Sem urgência agora. Capture pelo + ou abra o Kanban quando quiser.
      </p>
      <button
        type="button"
        onClick={() => navigate('/kanban')}
        className={`mt-3 gap-1.5 ${AXEL_BTN_MD} ${AXEL_BTN_PRIMARY}`}
      >
        <KanbanSquare className="w-4 h-4" aria-hidden />
        Abrir Kanban
      </button>
    </section>
  )
}
