import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { useTaskStore } from '../../store/useTaskStore'
import {
  formatTimelineHour,
  formatTimelineMinutes,
  partitionTodayTimelineTasks,
  TIMELINE_DAY_END_HOUR,
  TIMELINE_DAY_START_HOUR,
  TIMELINE_SLOT_MINUTES,
  timelineHourLabels,
} from '../../lib/kanbanTimeline'
import { AXEL_SOFT_CARD } from '../../constants/axelSurfaces'

interface KanbanDayTimelineViewProps
{
  tarefas: TarefaUnificada[]
  onOpen: (task: TarefaUnificada) => void
}

function todayHeading(): string
{
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  })
}

interface TimelineBlockProps
{
  item: {
    task: TarefaUnificada
    startMinutes: number
    durationMinutes: number
  }
  onOpen: (task: TarefaUnificada) => void
}

function TimelineBlock({ item, onOpen }: TimelineBlockProps)
{
  const updateSubtarefa = useTaskStore((s) => s.updateSubtarefa)
  const { task, startMinutes, durationMinutes } = item
  const subs = task.subtarefas ?? []
  const top = ((startMinutes - TIMELINE_DAY_START_HOUR * 60) / TIMELINE_SLOT_MINUTES) * 3.25
  const height = Math.max(3.25, (durationMinutes / TIMELINE_SLOT_MINUTES) * 3.25)

  return (
    <button
      type="button"
      onClick={() => onOpen(task)}
      className={`absolute left-0 right-0 mx-1 text-left rounded-sl border border-line/80 bg-card/90 hover:bg-chrome/60 transition-colors overflow-hidden border-l-[3px] border-l-tasks ${AXEL_SOFT_CARD}`}
      style={{
        top: `${top}rem`,
        minHeight: `${height}rem`,
      }}
    >
      <div className="px-2.5 py-2 space-y-1.5 min-h-[3rem]">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium text-ink leading-snug line-clamp-2">
            {task.titulo}
          </span>
          <span className="font-mono text-[10px] text-ink-muted tabular-nums shrink-0">
            {formatTimelineMinutes(startMinutes)}
          </span>
        </div>
        {subs.length > 0 && (
          <ul className="space-y-1" onClick={(e) => e.stopPropagation()}>
            {subs.map((sub) => (
              <li key={sub.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sub.concluida}
                  onChange={() => void updateSubtarefa(sub.id, { concluida: !sub.concluida })}
                  className="w-4 h-4 rounded border-line accent-health shrink-0"
                  aria-label={sub.titulo}
                />
                <span className={`text-[12px] leading-tight ${sub.concluida ? 'text-ink-muted line-through' : 'text-ink'}`}>
                  {sub.titulo}
                </span>
              </li>
            ))}
          </ul>
        )}
        {subs.length > 0 && (
          <p className="text-[10px] text-ink-muted tabular-nums">
            {subs.filter((s) => s.concluida).length}/{subs.length} subtarefas
          </p>
        )}
      </div>
    </button>
  )
}

function UnscheduledRow({
  task,
  onOpen,
}: {
  task: TarefaUnificada
  onOpen: (task: TarefaUnificada) => void
})
{
  const updateSubtarefa = useTaskStore((s) => s.updateSubtarefa)
  const subs = task.subtarefas ?? []

  return (
    <li className="rounded-sl border border-line/70 bg-card/40 px-3 py-2.5 space-y-2">
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="w-full text-left text-[13px] font-medium text-ink hover:text-accent transition-colors"
      >
        {task.titulo}
      </button>
      {subs.length > 0 && (
        <ul className="space-y-1">
          {subs.map((sub) => (
            <li key={sub.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sub.concluida}
                onChange={() => void updateSubtarefa(sub.id, { concluida: !sub.concluida })}
                className="w-4 h-4 rounded border-line accent-health shrink-0"
                aria-label={sub.titulo}
              />
              <span className={`text-[12px] ${sub.concluida ? 'text-ink-muted line-through' : 'text-ink'}`}>
                {sub.titulo}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** Linha do tempo vertical do dia - tarefas com horário em blocos, sem horário no topo */
export function KanbanDayTimelineView({ tarefas, onOpen }: KanbanDayTimelineViewProps)
{
  const [unscheduledOpen, setUnscheduledOpen] = useState(true)
  const { unscheduled, timed } = useMemo(
    () => partitionTodayTimelineTasks(tarefas),
    [tarefas],
  )

  const hours = timelineHourLabels()
  const gridHeightRem = hours.length * 3.25

  return (
    <div className="flex flex-col min-h-0 max-w-3xl lg:max-w-none w-full mx-auto space-y-4">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
          Linha do tempo
        </p>
        <h2 className="text-[15px] font-medium text-ink capitalize mt-0.5">
          {todayHeading()}
        </h2>
      </header>

      {unscheduled.length > 0 && (
        <section className="space-y-2">
          <button
            type="button"
            onClick={() => setUnscheduledOpen((v) => !v)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-ink-muted hover:text-ink"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${unscheduledOpen ? 'rotate-180' : ''}`} />
            Sem horário ({unscheduled.length})
          </button>
          {unscheduledOpen && (
            <ul className="space-y-2">
              {unscheduled.map((task) => (
                <UnscheduledRow key={task.id} task={task} onOpen={onOpen} />
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="relative flex gap-2 min-h-0">
        <div
          className="w-11 shrink-0 relative text-right pr-1"
          style={{ height: `${gridHeightRem}rem` }}
          aria-hidden
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute right-0 font-mono text-[10px] text-ink-muted tabular-nums -translate-y-1/2"
              style={{ top: `${((hour - TIMELINE_DAY_START_HOUR) * 3.25) + 1.625}rem` }}
            >
              {formatTimelineHour(hour)}
            </div>
          ))}
        </div>

        <div className="flex-1 min-w-0 relative border-l border-line/60">
          {hours.map((hour) => (
            <div
              key={hour}
              className="border-b border-line/30"
              style={{ height: '3.25rem' }}
            />
          ))}

          {timed.length === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-[13px] text-ink-muted px-4 text-center">
              Nenhuma tarefa com horário para hoje. Defina um horário no prazo da tarefa.
            </p>
          ) : (
            timed.map((item) => (
              <TimelineBlock key={item.task.id} item={item} onOpen={onOpen} />
            ))
          )}
        </div>
      </section>

      {timed.length > 0 && (
        <p className="text-[11px] text-ink-muted">
          Blocos até {formatTimelineHour(TIMELINE_DAY_END_HOUR)} · duração padrão 1h
        </p>
      )}
    </div>
  )
}
