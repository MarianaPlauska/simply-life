import { useMemo } from 'react'
import { ListTodo } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ACTIVE_DUE_BUCKETS,
  bucketByDueDate,
  DUE_BUCKET_LABELS,
  type DueBucket,
} from '../../lib/dueBucket'
import { useTaskStore } from '../../store/useTaskStore'
import { AXEL_LINK, AXEL_TEXT_SECONDARY, MODULE_METRIC } from '../../constants/axelSurfaces'
import { AxelListRow } from '../ui/AxelListRow'
import { EMPTY_COPY } from '../../lib/emptyCopy'
import { ModuleEmptyState } from '../ui/ModuleEmptyState'
import { ModuleSection } from '../ui/ModuleSection'

interface DueBarItem
{
  id: DueBucket
  label: string
  count: number
}

interface DashboardTaskDueBarsProps
{
  items: DueBarItem[]
}

const BAR_FILL: Record<string, string> = {
  vencido: 'bg-urgente',
  hoje: 'bg-tasks',
  esta_semana: 'bg-tasks/50',
}

const COUNT_TONE: Record<string, string> = {
  vencido: 'text-urgente',
  hoje: 'text-tasks',
  esta_semana: 'text-tasks',
}

const TASK_BUCKETS = ACTIVE_DUE_BUCKETS.filter(
  (b) => b === 'vencido' || b === 'hoje' || b === 'esta_semana',
)

/** Contagens de prazo para a rail e o Mais no mobile */
export function useDashboardDueItems(): DueBarItem[]
{
  const tarefas = useTaskStore((s) => s.tarefas)
  return useMemo(() =>
  {
    const buckets = bucketByDueDate(tarefas)
    return TASK_BUCKETS.map((id) => ({
      id,
      label: DUE_BUCKET_LABELS[id],
      count: buckets[id].length,
    }))
  }, [tarefas])
}

/** Barras horizontais de prazo — sem donut */
export function DashboardTaskDueBars({ items }: DashboardTaskDueBarsProps)
{
  const max = Math.max(...items.map((i) => i.count), 0)
  const total = items.reduce((s, i) => s + i.count, 0)

  if (total === 0)
  {
    return (
      <ModuleEmptyState
        icon={ListTodo}
        tone="tasks"
        message={EMPTY_COPY.tasksDueWeek}
      />
    )
  }

  return (
    <ul className="space-y-2.5">
      {items.map((item) =>
      {
        const pct = max > 0 ? Math.round((item.count / max) * 100) : 0
        const fill = BAR_FILL[item.id] ?? 'bg-tasks'
        const countClass = COUNT_TONE[item.id] ?? 'text-tasks'
        return (
          <li key={item.id}>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`sl-body ${AXEL_TEXT_SECONDARY}`}>{item.label}</span>
              <span className={`${MODULE_METRIC.tasks} ${countClass}`}>
                {item.count}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-chrome overflow-hidden">
              <div
                className={`h-full rounded-full ${fill}`}
                style={{ width: `${item.count === 0 ? 0 : Math.max(8, pct)}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Bloco Tarefas com faixa do módulo, títulos vencidos e atalhos */
export function DashboardTaskDueSection()
{
  const items = useDashboardDueItems()
  const navigate = useNavigate()
  const tarefas = useTaskStore((s) => s.tarefas)

  const overdueTitles = useMemo(() =>
  {
    const buckets = bucketByDueDate(tarefas)
    return buckets.vencido
      .filter((t) => t.status !== 'concluida')
      .slice(0, 3)
  }, [tarefas])

  return (
    <ModuleSection tone="tasks" label="Tarefas">
      <DashboardTaskDueBars items={items} />
      {overdueTitles.length > 0 && (
        <ul className="mt-2 border-t border-line pt-2">
          <p className={`text-[12px] mb-1 ${AXEL_TEXT_SECONDARY}`}>Passou da data</p>
          {overdueTitles.map((task) => (
            <AxelListRow
              key={task.id}
              title={task.titulo}
              subtitle={task.data_vencimento
                ? `Venceu ${task.data_vencimento.slice(0, 10).split('-').reverse().join('/')}`
                : 'Sem prazo definido'}
              titleClassName="text-urgente"
              onClick={() => navigate(`/kanban?task=${task.id}`)}
            />
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-x-3 mt-1">
        <Link
          to="/kanban"
          className={`inline-flex items-center min-h-[44px] text-[13px] font-medium ${AXEL_LINK}`}
        >
          Abrir Kanban
        </Link>
        <Link
          to="/kanban?foco=1"
          className={`inline-flex items-center min-h-[44px] text-[13px] font-medium ${AXEL_LINK}`}
        >
          Rotina guiada
        </Link>
      </div>
    </ModuleSection>
  )
}
