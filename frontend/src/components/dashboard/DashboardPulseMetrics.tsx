import { useNavigate } from 'react-router-dom'
import { ListChecks, TrendingUp, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { useTaskStore } from '../../store/useTaskStore'
import { mergeDashboardTasks } from '../../data/mockDashboardData'
import { bucketByDueDate } from '../../lib/dueBucket'
import { countAlertasHeader } from '../../lib/notificacaoUtils'
import { DashboardMetricTile } from './DashboardMetricTile'

const fmtBRL = (v: number | null | undefined) =>
  (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })

/** KPIs — ficam em Mais, não competem com a Main Quest */
export function DashboardPulseMetrics()
{
  const navigate = useNavigate()
  const notificacoes = useTaskStore((s) => s.notificacoes)
  const billSettlements = useTaskStore((s) => s.billSettlements)
  const transactions = useTaskStore((s) => s.transactions)
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
  const concluidas = resumo?.tarefas_concluidas
    ?? tarefas.filter((t) => t.status === 'concluida').length
  const saldo = resumo?.saldo_mes ?? 0
  const alertCtx = useMemo(
    () => ({ settlements: billSettlements, transactions }),
    [billSettlements, transactions],
  )
  const alertasTotal = countAlertasHeader(notificacoes, storeTarefas, alertCtx)
  const atrasadas = dueBuckets.vencido.length

  return (
    <div className="space-y-2">
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
      <div className="hidden lg:grid grid-cols-4 gap-2 sm:gap-3">
        <DashboardMetricTile
          label="Prazo hoje"
          value={String(dueBuckets.hoje.length)}
          hint="Vencem hoje"
          tone="tasks"
          icon={ListChecks}
          onClick={() => navigate('/kanban?bucket=hoje')}
        />
        <DashboardMetricTile
          label="Atrasadas"
          value={String(dueBuckets.vencido.length)}
          hint="Precisam de ação"
          tone={dueBuckets.vencido.length > 0 ? 'urgent' : 'ink'}
          icon={ListChecks}
          onClick={() => navigate('/kanban?bucket=vencido')}
        />
        <DashboardMetricTile
          label="Concluídas"
          value={String(concluidas)}
          hint="ciclo atual"
          tone="ink"
          icon={TrendingUp}
        />
        <DashboardMetricTile
          label="Alertas"
          value={String(alertasTotal)}
          hint="não lidos + prazos"
          tone={alertasTotal > 0 ? 'urgent' : 'ink'}
          icon={ListChecks}
        />
      </div>
    </div>
  )
}
