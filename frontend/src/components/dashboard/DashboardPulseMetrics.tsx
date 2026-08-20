import { useNavigate } from 'react-router-dom'
import { ListChecks, TrendingUp, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { bucketByDueDate } from '../../lib/dueBucket'
import { DashboardMetricTile } from './DashboardMetricTile'

const fmtBRL = (v: number | null | undefined) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** KPIs — ficam em Mais, não competem com a Main Quest */
export function DashboardPulseMetrics()
{
  const navigate = useNavigate()
  const resumo = useTaskStore((s) => s.dashboardResumo)
  const storeTarefas = useTaskStore((s) => s.tarefas)
  const streakCount = useTaskStore((s) => s.streakCount)
  const isStreakSafeToday = useTaskStore((s) => s.isStreakSafeToday)

  const tarefas = useMemo(() => mergeDashboardTasks(storeTarefas), [storeTarefas])
  const dueBuckets = useMemo(
    () => bucketByDueDate(tarefas.filter((t) => t.status !== 'concluida')),
    [tarefas],
  )

  const pendentes = resumo?.tarefas_pendentes
    ?? tarefas.filter((t) => t.status !== 'concluida').length
  const criticas = resumo?.tarefas_criticas
    ?? tarefas.filter((t) => t.status !== 'concluida' && (t.score_urgencia ?? 0) >= 90).length
  const saldo = resumo?.saldo_mes ?? 0
  const atrasadas = dueBuckets.vencido.length

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-5">
      <DashboardMetricTile
        label="Execução"
        value={String(pendentes)}
        hint={atrasadas > 0 ? `${atrasadas} atrasada${atrasadas !== 1 ? 's' : ''}` : `${criticas} crítica${criticas !== 1 ? 's' : ''}`}
        tone={atrasadas > 0 || criticas > 0 ? 'urgent' : 'tasks'}
        icon={ListChecks}
        onClick={() => navigate(atrasadas > 0 ? '/kanban?bucket=vencido' : '/kanban')}
      />
      <DashboardMetricTile
        label="Progresso"
        value={`${streakCount}`}
        hint={isStreakSafeToday() ? 'dia(s) · registrado hoje' : 'Registre uma tarefa ou humor'}
        tone="ink"
        icon={TrendingUp}
        onClick={() => navigate('/kanban?panel=executar')}
      />
      <DashboardMetricTile
        label="Saldo"
        value={fmtBRL(saldo)}
        hint="mensal"
        tone="finance"
        icon={Wallet}
        onClick={() => navigate('/financeiro')}
      />
    </div>
  )
}
