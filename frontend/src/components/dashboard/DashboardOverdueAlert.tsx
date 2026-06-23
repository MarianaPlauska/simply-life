import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { bucketByDueDate } from '../../lib/dueBucket'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function DashboardOverdueAlert()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)

  const overdue = useMemo(() =>
  {
    const ativas = mergeDashboardTasks(storeTarefas).filter((t) => t.status !== 'concluida')
    return bucketByDueDate(ativas).vencido
  }, [storeTarefas])

  if (overdue.length === 0) return null

  const preview = overdue[0]?.titulo ?? 'Tarefa'
  const extra = overdue.length > 1 ? ` (+${overdue.length - 1})` : ''

  return (
    <button
      type="button"
      onClick={() => navigate('/kanban?bucket=vencido')}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-sl border border-urgente/35 bg-urgente/10 text-left hover:bg-urgente/15 transition-colors"
    >
      <AlertTriangle className="w-4 h-4 text-urgente shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-[12px] font-medium ${AXEL_TEXT_PRIMARY}`}>
          {overdue.length} tarefa{overdue.length !== 1 ? 's' : ''} atrasada{overdue.length !== 1 ? 's' : ''}
        </p>
        <p className={`text-[11px] truncate ${AXEL_TEXT_SECONDARY}`}>
          {preview}{extra}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-urgente shrink-0" />
    </button>
  )
}
