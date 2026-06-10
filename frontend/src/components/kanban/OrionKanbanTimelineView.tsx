import { useMemo } from 'react'
import { getProjectTag } from '../../lib/contextRationale'
import { useSubtaskProgress } from '../../lib/subtaskProgress'
import { urgencyScoreClass } from '../../lib/kanbanVisual'
import { ORION_KANBAN_TABLE } from '../../constants/orionKanbanTheme'
import {
  ORION_PROGRESS,
  ORION_ROW_HOVER,
  ORION_TEXT_PRIMARY,
  ORION_TEXT_SECONDARY,
} from '../../constants/orionSurfaces'
import { cleanTitleForDisplay } from './orionKanbanUtils'
import type { TarefaUnificada } from '../../types'

// Timeline Gantt — barras monocromáticas com acento por urgência

interface OrionKanbanTimelineViewProps
{
  tarefas: TarefaUnificada[]
  onOpen: (t: TarefaUnificada) => void
}

const RANGE_DAYS = 14
const DAY_MS = 86_400_000

function taskRange(t: TarefaUnificada, rangeStart: number): { left: number; width: number }
{
  const start = t.created_at
    ? new Date(t.created_at).getTime()
    : rangeStart
  const end = t.data_vencimento
    ? new Date(t.data_vencimento).getTime()
    : start + 3 * DAY_MS

  const s = Math.max(start, rangeStart)
  const e = Math.max(s + DAY_MS, end)
  const left = ((s - rangeStart) / (RANGE_DAYS * DAY_MS)) * 100
  const width = Math.min(100 - left, ((e - s) / (RANGE_DAYS * DAY_MS)) * 100)

  return { left: Math.max(0, left), width: Math.max(4, width) }
}

function TimelineRow({
  tarefa,
  rangeStart,
  onOpen,
}: {
  tarefa: TarefaUnificada
  rangeStart: number
  onOpen: () => void
})
{
  const tag = getProjectTag(tarefa)
  const score = tarefa.score_urgencia ?? 0
  const { left, width } = taskRange(tarefa, rangeStart)
  const { percent } = useSubtaskProgress(tarefa.id, tarefa.subtarefas)

  return (
    <div className={`grid grid-cols-[200px_1fr] gap-3 items-center min-h-[40px] border-b border-line ${ORION_ROW_HOVER}`}>
      <button
        type="button"
        onClick={onOpen}
        className={`text-left text-xs truncate px-3 py-2 ${ORION_TEXT_SECONDARY} hover:text-ink`}
      >
        <span className={`font-mono text-[9px] uppercase mr-1.5 ${urgencyScoreClass(score)}`}>
          {score}
        </span>
        {cleanTitleForDisplay(tarefa.titulo)}
      </button>
      <div className="relative h-8 py-1.5 pr-3">
        <button
          type="button"
          onClick={onOpen}
          className="absolute top-1/2 -translate-y-1/2 h-6 rounded-sl border border-line bg-chrome overflow-hidden hover:border-accent/40 transition-colors"
          style={{ left: `${left}%`, width: `${width}%` }}
          title={tag}
        >
          <div
            className={`h-full ${ORION_PROGRESS} opacity-80 transition-all duration-500`}
            style={{ width: `${percent}%` }}
          />
          <span className={`absolute inset-0 flex items-center px-2 text-[10px] truncate pointer-events-none ${ORION_TEXT_PRIMARY}`}>
            {cleanTitleForDisplay(tarefa.titulo)}
          </span>
        </button>
      </div>
    </div>
  )
}

export function OrionKanbanTimelineView({ tarefas, onOpen }: OrionKanbanTimelineViewProps)
{
  const { rangeStart, dayLabels } = useMemo(() =>
  {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const labels: string[] = []
    for (let i = 0; i < RANGE_DAYS; i++)
    {
      const d = new Date(start.getTime() + i * DAY_MS)
      labels.push(
        d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }),
      )
    }
    return { rangeStart: start.getTime(), dayLabels: labels }
  }, [])

  const sorted = [...tarefas].sort(
    (a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0),
  )

  return (
    <div className={`flex-1 min-h-[480px] ${ORION_KANBAN_TABLE} flex flex-col`}>
      <div className="grid grid-cols-[200px_1fr] gap-3 border-b border-line bg-chrome/50 px-2 py-2 shrink-0">
        <span className={`font-mono text-[9px] uppercase tracking-[0.14em] pl-2 ${ORION_TEXT_SECONDARY}`}>
          Tarefa
        </span>
        <div
          className={`grid font-mono text-[9px] tabular-nums pr-3 ${ORION_TEXT_SECONDARY}`}
          style={{ gridTemplateColumns: `repeat(${RANGE_DAYS}, minmax(0, 1fr))` }}
        >
          {dayLabels.map((label, i) => (
            <span key={i} className="text-center truncate">
              {label.split(' ')[0]}
            </span>
          ))}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto relative sl-kanban-canvas"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--sl-border-subtle) 1px, transparent 1px)',
          backgroundSize: `${100 / RANGE_DAYS}% 100%`,
        }}
      >
        {sorted.map((t) => (
          <TimelineRow
            key={t.id}
            tarefa={t}
            rangeStart={rangeStart}
            onOpen={() => onOpen(t)}
          />
        ))}
        {sorted.length === 0 && (
          <p className={`text-sm text-center py-16 ${ORION_TEXT_SECONDARY}`}>
            Nenhuma tarefa para mapear.
          </p>
        )}
      </div>
    </div>
  )
}
