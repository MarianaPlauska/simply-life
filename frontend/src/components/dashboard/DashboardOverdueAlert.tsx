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
      className="w-full flex items-center gap-2.5 py-2.5 border-t-[0.5px] border-urgente/40 text-left hover:bg-urgente/5 transition-colors min-h-[44px]"
    >
      <AlertTriangle className="w-4 h-4 text-urgente shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-semibold ${AXEL_TEXT_PRIMARY}`}>
          {overdue.length} tarefa{overdue.length !== 1 ? 's' : ''} atrasada{overdue.length !== 1 ? 's' : ''}. Precisa de atenção
        </p>
        <p className={`text-[12px] truncate ${AXEL_TEXT_SECONDARY}`}>
          {preview}{extra}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-urgente shrink-0" />
    </button>
  )
}
