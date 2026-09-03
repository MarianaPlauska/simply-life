import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { TarefaUnificada } from '../../types'
import { startOfDay } from '../../lib/dueBucket'
import { clockLabel, hasClockTime } from '../../lib/taskDueTime'
import { AXEL_DESKTOP_RAIL, AXEL_METRIC_HAIRLINE, AXEL_TEXT_SECONDARY } from '../../constants/axelSurfaces'
import { AxelListRow } from '../ui/AxelListRow'

interface KanbanDesktopRailProps
{
  tarefas: TarefaUnificada[]
  onOpen: (task: TarefaUnificada) => void
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function dateKey(d: Date): string
{
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDueKey(dataVencimento: string): string | null
{
  const due = new Date(dataVencimento)
  if (Number.isNaN(due.getTime())) return null
  return dateKey(due)
}

/** Mini-calendário + próximas 48h - rail do Kanban em lg+ */
export function KanbanDesktopRail({ tarefas, onOpen }: KanbanDesktopRailProps)
{
  const navigate = useNavigate()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const tasksByDay = useMemo(() =>
  {
    const map: Record<string, TarefaUnificada[]> = {}
    for (const t of tarefas)
    {
      if (!t.data_vencimento || t.status === 'concluida') continue
      const key = parseDueKey(t.data_vencimento)
      if (!key) continue
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return map
  }, [tarefas])

  const upcoming = useMemo(() =>
  {
    const now = Date.now()
    const horizon = now + 48 * 60 * 60 * 1000
    return tarefas
      .filter((t) => t.status !== 'concluida' && t.data_vencimento)
      .map((t) => ({ task: t, at: new Date(t.data_vencimento as string).getTime() }))
      .filter(({ at }) => !Number.isNaN(at) && at >= now - 60 * 60 * 1000 && at <= horizon)
      .sort((a, b) => a.at - b.at)
      .slice(0, 5)
  }, [tarefas])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  const todayKey = dateKey(today)

  const shiftMonth = (delta: number) =>
  {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  return (
    <aside className={AXEL_DESKTOP_RAIL} aria-label="Contexto do Kanban">
      <section className={AXEL_METRIC_HAIRLINE}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
            Mês
          </p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1 rounded-sl text-ink-muted hover:text-ink hover:bg-chrome"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[13px] font-medium text-ink capitalize">{monthLabel}</p>
        <div className="grid grid-cols-7 gap-0.5 mt-2 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={`${d}-${i}`} className="text-[9px] text-ink-muted font-mono">
              {d}
            </span>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) =>
          {
            const day = i + 1
            const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const count = tasksByDay[key]?.length ?? 0
            const isToday = key === todayKey
            return (
              <span
                key={key}
                className={`text-[10px] tabular-nums py-0.5 rounded-sm ${
                  isToday
                    ? 'bg-axel-muted text-axel font-semibold'
                    : count > 0
                      ? 'text-ink font-medium'
                      : 'text-ink-muted'
                }`}
                title={count > 0 ? `${count} tarefa(s)` : undefined}
              >
                {day}
              </span>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => navigate('/calendario')}
          className="mt-2 text-[11px] text-ink-muted hover:text-ink hover:underline"
        >
          Abrir calendário
        </button>
      </section>

      <section className={AXEL_METRIC_HAIRLINE}>
        <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${AXEL_TEXT_SECONDARY}`}>
          Próximas 48h
        </p>
        {upcoming.length === 0 ? (
          <p className="text-[12px] text-ink-muted mt-2">
            Nada com prazo nas próximas 48 horas.
          </p>
        ) : (
          <ul className="mt-2 space-y-0">
            {upcoming.map(({ task }) =>
            {
              const when = task.data_vencimento
                ? hasClockTime(task.data_vencimento)
                  ? clockLabel(task.data_vencimento)
                  : new Date(task.data_vencimento).toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: 'numeric',
                    })
                : ''
              return (
                <AxelListRow
                  key={task.id}
                  title={task.titulo}
                  subtitle={when}
                  onClick={() => onOpen(task)}
                />
              )
            })}
          </ul>
        )}
      </section>
    </aside>
  )
}
