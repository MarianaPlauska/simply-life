import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { listTarefasAtrasadas } from '../../lib/notificacaoUtils'
import { AXEL_TEXT_PRIMARY, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'

export function DashboardOverdueAlert()
{
  const navigate = useNavigate()
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const transactions = useTaskStore((s) => s.transactions)

  const alertCtx = useMemo(
    () => ({ settlements: billSettlements, transactions }),
    [billSettlements, transactions],
  )

  const overdue = useMemo(
    () => listTarefasAtrasadas(storeTarefas, alertCtx),
    [storeTarefas, alertCtx],
  )

  if (overdue.length === 0) return null

  const preview = overdue[0]?.task.titulo ?? 'Tarefa'
  const extra = overdue.length > 1 ? ` (+${overdue.length - 1})` : ''

  return (
    <button
      type="button"
      onClick={() => navigate('/kanban?bucket=vencido')}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-sl border-2 border-urgente/50 bg-urgente/10 text-left hover:bg-urgente/15 transition-colors shadow-sm"
    >
      <AlertTriangle className="w-6 h-6 text-urgente shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-[14px] font-semibold ${AXEL_TEXT_PRIMARY}`}>
          {overdue.length} tarefa{overdue.length !== 1 ? 's' : ''} atrasada{overdue.length !== 1 ? 's' : ''} — precisa de atenção
        </p>
        <p className={`text-[13px] truncate ${AXEL_TEXT_SECONDARY}`}>
          {preview}{extra}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-urgente shrink-0" />
    </button>
  )
}
