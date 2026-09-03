import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTaskStore } from '../../store/useTaskStore'
import { bucketByDueDate } from '../../lib/dueBucket'
import { FinanceRecentTransactions } from '../Finance/FinanceRecentTransactions'
import { AtividadeRecenteCard } from './AtividadeRecenteCard'
import { AxelListRow } from '../ui/AxelListRow'
import { AXEL_LINK, AXEL_METRIC_HAIRLINE } from '../../constants/axelSurfaces'
import { ModuleSection } from '../ui/ModuleSection'

export function DashboardDesktopMainFeed()
{
  const navigate = useNavigate()
  const tarefas = useTaskStore((s) => s.tarefas)
  const transactions = useTaskStore((s) => s.transactions)
  const categories = useTaskStore((s) => s.categories)

  const monthTransactions = useMemo(() =>
  {
    const now = new Date()
    const m = now.getMonth()
    const y = now.getFullYear()
    return transactions.filter((t) =>
    {
      const d = new Date(`${t.data.slice(0, 10)}T12:00:00`)
      return d.getMonth() === m && d.getFullYear() === y
    })
  }, [transactions])

  const overdueTitles = useMemo(() =>
  {
    const buckets = bucketByDueDate(tarefas.filter((t) => t.status !== 'concluida'))
    return buckets.vencido.slice(0, 3)
  }, [tarefas])

  return (
    <div className="hidden xl:flex flex-col gap-5 min-w-0">
      {overdueTitles.length > 0 && (
        <ModuleSection tone="tasks" label="Passou da data">
          <ul>
            {overdueTitles.map((task) => (
              <AxelListRow
                key={task.id}
                title={task.titulo}
                subtitle={task.data_vencimento
                  ? `Venceu ${task.data_vencimento.slice(0, 10).split('-').reverse().join('/')}`
                  : 'Sem prazo'}
                titleClassName="text-urgente"
                onClick={() => navigate(`/kanban?task=${task.id}`)}
              />
            ))}
          </ul>
          <Link
            to="/kanban?bucket=vencido"
            className={`inline-flex items-center min-h-[44px] mt-1 text-[13px] font-medium ${AXEL_LINK}`}
          >
            Ver todos no Kanban
          </Link>
        </ModuleSection>
      )}

      <FinanceRecentTransactions
        transactions={monthTransactions}
        categories={categories}
        limit={5}
        onOpenLedger={() => navigate('/financeiro#movimentos')}
      />

      <div className={AXEL_METRIC_HAIRLINE}>
        <AtividadeRecenteCard embedded />
      </div>
    </div>
  )
}
