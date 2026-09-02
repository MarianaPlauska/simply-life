import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { startOfDay } from '../../lib/dueBucket'
import { urgencyScoreClass } from '../../lib/kanbanVisual'
import { cleanTitleForDisplay } from './axelKanbanUtils'
import type { TarefaUnificada } from '../../types'

interface KanbanCalendarViewProps
{
  tarefas: TarefaUnificada[]
  onOpen: (task: TarefaUnificada) => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MAX_CHIPS = 3

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

export function KanbanCalendarView({ tarefas, onOpen }: KanbanCalendarViewProps)
{
  const today = useMemo(() => startOfDay(new Date()), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedKey, setSelectedKey] = useState<string | null>(dateKey(today))

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

    for (const key of Object.keys(map))
    {
      map[key].sort((a, b) => (b.score_urgencia ?? 0) - (a.score_urgencia ?? 0))
    }

    return map
  }, [tarefas])

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const selectedTasks = selectedKey ? (tasksByDay[selectedKey] ?? []) : []
  const selectedLabel = selectedKey
    ? new Date(`${selectedKey}T12:00:00`).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
      })
    : 'Selecione um dia'

  const shiftMonth = (delta: number) =>
  {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setSelectedKey(null)
  }

  const todayKey = dateKey(today)

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row border border-line rounded-sl bg-card overflow-hidden">
      <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="p-2 rounded-sl border border-line hover:bg-chrome transition-colors text-ink-muted"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="font-display text-lg text-ink capitalize">{monthLabel}</span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="p-2 rounded-sl border border-line hover:bg-chrome transition-colors text-ink-muted"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1 shrink-0">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="text-center font-mono text-[10px] uppercase tracking-wider text-ink-muted py-1"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-7 gap-px bg-line border border-line rounded-sl overflow-hidden">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e-${i}`} className="min-h-[88px] bg-chrome/30" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) =>
            {
              const day = i + 1
              const key = dateKey(new Date(year, month, day))
              const dayTasks = tasksByDay[key] ?? []
              const isToday = key === todayKey
              const selected = key === selectedKey
              const overdue = key < todayKey && dayTasks.length > 0
              const visible = dayTasks.slice(0, MAX_CHIPS)
              const overflow = dayTasks.length - visible.length

              return (
                <div
                  key={day}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedKey(key)}
                  onKeyDown={(e) =>
                  {
                    if (e.key === 'Enter' || e.key === ' ')
                    {
                      e.preventDefault()
                      setSelectedKey(key)
                    }
                  }}
                  className={[
                    'min-h-[88px] flex flex-col p-1 bg-elevated text-left transition-colors cursor-pointer',
                    selected ? 'bg-accent-muted/40 ring-1 ring-inset ring-accent/40' : 'hover:bg-chrome/50',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={[
                        'font-mono text-[11px] w-6 h-6 flex items-center justify-center rounded-sl tabular-nums shrink-0',
                        isToday ? 'bg-ink text-fundo font-semibold' : 'text-ink',
                        overdue && !isToday ? 'text-urgente' : '',
                      ].join(' ')}
                    >
                      {day}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="font-mono text-[9px] text-ink-muted tabular-nums">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5 min-h-0 overflow-hidden">
                    {visible.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={(e) =>
                        {
                          e.stopPropagation()
                          onOpen(t)
                        }}
                        className="w-full text-left px-1 py-0.5 rounded-sm border border-line bg-card hover:border-accent/50 transition-colors"
                        title={cleanTitleForDisplay(t.titulo)}
                      >
                        <span className="block text-[9px] leading-tight text-ink line-clamp-2">
                          {cleanTitleForDisplay(t.titulo)}
                        </span>
                      </button>
                    ))}
                    {overflow > 0 && (
                      <span className="block font-mono text-[8px] text-ink-muted px-0.5">
                        +{overflow} mais
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <aside className="lg:w-[min(100%,320px)] shrink-0 border-t lg:border-t-0 lg:border-l border-line bg-chrome/20 p-4 flex flex-col min-h-[200px] max-h-[50vh] lg:max-h-none">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted mb-1">
          Demandas do dia
        </h3>
        <p className="text-[13px] text-ink capitalize mb-3">{selectedLabel}</p>

        {selectedTasks.length === 0 ? (
          <p className="text-[12px] text-ink-muted leading-relaxed">
            Nenhuma tarefa com prazo neste dia.
          </p>
        ) : (
          <ul className="space-y-2 overflow-y-auto custom-scrollbar flex-1">
            {selectedTasks.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(t)}
                  className="w-full text-left px-3 py-2.5 rounded-sl border border-line bg-card hover:border-accent/40 transition-colors"
                >
                  <p className="text-[13px] text-ink line-clamp-2 leading-snug">
                    {cleanTitleForDisplay(t.titulo)}
                  </p>
                  <p className={`font-mono text-[10px] mt-1 tabular-nums ${urgencyScoreClass(t.score_urgencia ?? 0)}`}>
                    {t.score_urgencia ?? 0} pts
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  )
}
