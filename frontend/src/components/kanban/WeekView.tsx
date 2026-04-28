// WeekView — planejamento semanal com colunas de dias da semana
// exibe tarefas organizadas por dia baseado na data_vencimento
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, GripVertical } from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { PRIO_BADGE } from '../../constants/kanbanConfig'

interface WeekViewProps
{
  tarefas: TarefaUnificada[]
  onSelectTarefa: (t: TarefaUnificada) => void
  onCreateTarefa?: (date: string) => void
}

const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

// retorna a segunda-feira da semana do date
function getMonday (date: Date): Date
{
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDateKey (date: Date): string
{
  return date.toISOString().split('T')[0]
}

// chip compacto de tarefa pra caber na célula semanal
function WeekTaskChip ({ tarefa, onClick }: { tarefa: TarefaUnificada; onClick: () => void })
{
  const prio = tarefa.prioridade || 'media'
  const prioStyle = PRIO_BADGE[prio] || PRIO_BADGE.media
  const statusColor =
    tarefa.status === 'concluida' ? 'border-l-emerald-500' :
    tarefa.status === 'em_progresso' ? 'border-l-amber-500' :
    'border-l-zinc-600'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-lg border-l-[3px] ${statusColor}
                  bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/30 hover:border-zinc-600/50
                  transition-all duration-200 group cursor-pointer`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-3 h-3 text-zinc-700 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="min-w-0 flex-1">
          <p className={`text-[12px] font-medium leading-snug truncate ${
            tarefa.status === 'concluida' ? 'text-zinc-500 line-through' : 'text-zinc-200'
          }`}>
            {tarefa.titulo}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${prioStyle.bg} ${prioStyle.color}`}>
              {prio}
            </span>
            {tarefa.labels && tarefa.labels.length > 0 && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tarefa.labels[0].cor }}
                title={tarefa.labels[0].nome}
              />
            )}
          </div>
        </div>
      </div>
    </button>
  )
}


export function WeekView ({ tarefas, onSelectTarefa, onCreateTarefa }: WeekViewProps)
{
  const [weekOffset, setWeekOffset] = useState(0)

  // calcula os 7 dias da semana atual + offset
  const weekDays = useMemo(() =>
  {
    const now = new Date()
    now.setDate(now.getDate() + weekOffset * 7)
    const monday = getMonday(now)
    return Array.from({ length: 7 }).map((_, i) =>
    {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      return d
    })
  }, [weekOffset])

  const todayKey = formatDateKey(new Date())

  // agrupa tarefas por data de vencimento
  const tasksByDay = useMemo(() =>
  {
    const map = new Map<string, TarefaUnificada[]>()
    for (const d of weekDays)
    {
      map.set(formatDateKey(d), [])
    }

    for (const t of tarefas)
    {
      if (!t.data_vencimento) continue
      const key = t.data_vencimento.split('T')[0]
      if (map.has(key))
      {
        map.get(key)!.push(t)
      }
    }
    return map
  }, [tarefas, weekDays])

  // tarefas sem data
  const unscheduled = useMemo(() =>
    tarefas.filter((t) => !t.data_vencimento),
    [tarefas]
  )

  // contagem total da semana
  const weekTotal = useMemo(() =>
  {
    let total = 0
    tasksByDay.forEach((tasks) => { total += tasks.length })
    return total
  }, [tasksByDay])

  const weekLabel = useMemo(() =>
  {
    const first = weekDays[0]
    const last = weekDays[6]
    return `${first.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — ${last.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`
  }, [weekDays])

  return (
    <div className="space-y-4">
      {/* navegação semanal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="p-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold text-white">{weekLabel}</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {weekTotal} tarefa{weekTotal !== 1 ? 's' : ''} nesta semana
            </p>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="p-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={() => setWeekOffset(0)}
          className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
            weekOffset === 0
              ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
              : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Hoje
        </button>
      </div>

      {/* grade semanal */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) =>
        {
          const key = formatDateKey(day)
          const isToday = key === todayKey
          const dayTasks = tasksByDay.get(key) || []
          const isWeekend = idx >= 5

          return (
            <div
              key={key}
              className={`rounded-xl border min-h-[200px] flex flex-col transition-all ${
                isToday
                  ? 'border-violet-500/40 bg-violet-500/[0.03] shadow-[0_0_20px_rgba(139,92,246,0.06)]'
                  : isWeekend
                    ? 'border-zinc-800/40 bg-zinc-900/20'
                    : 'border-zinc-800/50 bg-zinc-900/40'
              }`}
            >
              {/* cabeçalho do dia */}
              <div className={`px-3 py-2.5 border-b ${
                isToday ? 'border-violet-500/20' : 'border-zinc-800/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                      isToday ? 'text-violet-400' : isWeekend ? 'text-zinc-600' : 'text-zinc-500'
                    }`}>
                      {DIAS_SEMANA[idx]}
                    </span>
                    <p className={`text-[18px] font-bold leading-none mt-0.5 ${
                      isToday ? 'text-violet-300' : 'text-zinc-300'
                    }`}>
                      {day.getDate()}
                    </p>
                  </div>
                  {dayTasks.length > 0 && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${
                      isToday ? 'bg-violet-500/15 text-violet-400' : 'bg-zinc-800/60 text-zinc-500'
                    }`}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>
              </div>

              {/* tarefas do dia */}
              <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-zinc-800">
                {dayTasks.map((t) => (
                  <WeekTaskChip key={t.id} tarefa={t} onClick={() => onSelectTarefa(t)} />
                ))}
                {dayTasks.length === 0 && (
                  <div className="flex items-center justify-center h-16">
                    <span className="text-[10px] text-zinc-700">—</span>
                  </div>
                )}
              </div>

              {/* botão add */}
              {onCreateTarefa && (
                <button
                  onClick={() => onCreateTarefa(key)}
                  className="mx-2 mb-2 flex items-center justify-center gap-1 py-1.5 rounded-lg
                             text-[11px] text-zinc-600 hover:text-zinc-300
                             border border-dashed border-zinc-800/40 hover:border-zinc-700
                             transition-all"
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* tarefas sem data */}
      {unscheduled.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-zinc-800/50" />
            <span className="text-[11px] text-zinc-600 font-medium uppercase tracking-wider">
              Sem data definida ({unscheduled.length})
            </span>
            <div className="h-px flex-1 bg-zinc-800/50" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {unscheduled.slice(0, 12).map((t) => (
              <WeekTaskChip key={t.id} tarefa={t} onClick={() => onSelectTarefa(t)} />
            ))}
          </div>
          {unscheduled.length > 12 && (
            <p className="text-center text-[11px] text-zinc-600">
              +{unscheduled.length - 12} tarefas sem data
            </p>
          )}
        </div>
      )}
    </div>
  )
}
