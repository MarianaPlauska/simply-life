// MonthView — calendário mensal com tarefas nos dias
// visual clean tipo calendário Google/Notion com tarefas como chips
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Circle, CheckCircle2 } from 'lucide-react'
import type { TarefaUnificada } from '../../types'
import { PRIO_BADGE } from '../../constants/kanbanConfig'

interface MonthViewProps
{
  tarefas: TarefaUnificada[]
  onSelectTarefa: (t: TarefaUnificada) => void
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DIAS_CURTOS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

function getDaysInMonth (year: number, month: number): number
{
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth (year: number, month: number): number
{
  const day = new Date(year, month, 1).getDay()
  // converte de domingo=0 para segunda=0
  return day === 0 ? 6 : day - 1
}

function formatDateKey (y: number, m: number, d: number): string
{
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}


// chip de tarefa compacto para o calendário
function MonthTaskChip ({ tarefa, onClick }: { tarefa: TarefaUnificada; onClick: () => void })
{
  const prio = tarefa.prioridade || 'media'
  const prioStyle = PRIO_BADGE[prio] || PRIO_BADGE.media
  const isDone = tarefa.status === 'concluida'

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md
                 hover:bg-zinc-700/40 transition-colors group text-left"
    >
      {isDone
        ? <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
        : <Circle className="w-3 h-3 shrink-0" style={{ color: prioStyle.color.includes('red') ? '#ef4444' : prioStyle.color.includes('amber') ? '#f59e0b' : prioStyle.color.includes('violet') ? '#8b5cf6' : '#71717a' }} />
      }
      <span className={`text-[10px] truncate ${isDone ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
        {tarefa.titulo}
      </span>
    </button>
  )
}


export function MonthView ({ tarefas, onSelectTarefa }: MonthViewProps)
{
  const hoje = new Date()
  const [viewYear, setViewYear] = useState(hoje.getFullYear())
  const [viewMonth, setViewMonth] = useState(hoje.getMonth())

  const todayKey = useMemo(() =>
    formatDateKey(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  // navegação de meses
  const goToPrev = () =>
  {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
  }
  const goToNext = () =>
  {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
  }
  const goToToday = () =>
  {
    setViewYear(hoje.getFullYear())
    setViewMonth(hoje.getMonth())
  }

  const isCurrentMonth = viewYear === hoje.getFullYear() && viewMonth === hoje.getMonth()

  // gera grid do calendário
  const calendarDays = useMemo(() =>
  {
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

    // dias do mês anterior para preencher a primeira semana
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth)

    const cells: Array<{ day: number; month: number; year: number; isCurrentMonth: boolean; key: string }> = []

    // dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--)
    {
      const d = daysInPrevMonth - i
      cells.push({
        day: d, month: prevMonth, year: prevYear,
        isCurrentMonth: false,
        key: formatDateKey(prevYear, prevMonth, d),
      })
    }

    // dias do mês atual
    for (let d = 1; d <= daysInMonth; d++)
    {
      cells.push({
        day: d, month: viewMonth, year: viewYear,
        isCurrentMonth: true,
        key: formatDateKey(viewYear, viewMonth, d),
      })
    }

    // preenche até completar 6 semanas (42 células)
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear
    let nextDay = 1
    while (cells.length < 42)
    {
      cells.push({
        day: nextDay, month: nextMonth, year: nextYear,
        isCurrentMonth: false,
        key: formatDateKey(nextYear, nextMonth, nextDay),
      })
      nextDay++
    }

    return cells
  }, [viewYear, viewMonth])

  // agrupa tarefas por data
  const tasksByDate = useMemo(() =>
  {
    const map = new Map<string, TarefaUnificada[]>()
    for (const t of tarefas)
    {
      if (!t.data_vencimento) continue
      const key = t.data_vencimento.split('T')[0]
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return map
  }, [tarefas])

  // stats do mês
  const monthStats = useMemo(() =>
  {
    let total = 0, done = 0
    for (const cell of calendarDays)
    {
      if (!cell.isCurrentMonth) continue
      const tasks = tasksByDate.get(cell.key) || []
      total += tasks.length
      done += tasks.filter((t) => t.status === 'concluida').length
    }
    return { total, done, pending: total - done }
  }, [calendarDays, tasksByDate])

  return (
    <div className="space-y-4">
      {/* header com navegação */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrev}
            className="p-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center min-w-[180px]">
            <h3 className="text-[18px] font-bold text-white">
              {MESES[viewMonth]} {viewYear}
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {monthStats.total} tarefa{monthStats.total !== 1 ? 's' : ''}
              {monthStats.done > 0 && ` · ${monthStats.done} concluída${monthStats.done !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={goToNext}
            className="p-1.5 rounded-lg bg-zinc-800/60 border border-zinc-700/40 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* indicadores */}
          <div className="flex items-center gap-3 mr-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] text-zinc-500">{monthStats.pending} pendente{monthStats.pending !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-zinc-500">{monthStats.done} concluída{monthStats.done !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <button
            onClick={goToToday}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
              isCurrentMonth
                ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                : 'bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Hoje
          </button>
        </div>
      </div>

      {/* cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-px">
        {DIAS_CURTOS.map((dia, idx) => (
          <div
            key={dia}
            className={`py-2 text-center text-[11px] font-semibold uppercase tracking-wider ${
              idx >= 5 ? 'text-zinc-600' : 'text-zinc-500'
            }`}
          >
            {dia}
          </div>
        ))}
      </div>

      {/* grid do calendário */}
      <div className="grid grid-cols-7 gap-px bg-zinc-800/20 rounded-xl overflow-hidden border border-zinc-800/40">
        {calendarDays.map((cell) =>
        {
          const isToday = cell.key === todayKey
          const dayTasks = tasksByDate.get(cell.key) || []
          const dayIdx = calendarDays.indexOf(cell) % 7
          const isWeekend = dayIdx >= 5

          return (
            <div
              key={cell.key}
              className={`min-h-[110px] p-1.5 flex flex-col transition-colors ${
                !cell.isCurrentMonth
                  ? 'bg-zinc-950/50'
                  : isToday
                    ? 'bg-violet-500/[0.04]'
                    : isWeekend
                      ? 'bg-zinc-900/60'
                      : 'bg-zinc-900/80'
              }`}
            >
              {/* número do dia */}
              <div className="flex items-center justify-between mb-1 px-1">
                <span className={`text-[12px] font-medium ${
                  !cell.isCurrentMonth
                    ? 'text-zinc-700'
                    : isToday
                      ? 'text-violet-400 font-bold'
                      : 'text-zinc-400'
                }`}>
                  {cell.day}
                </span>
                {isToday && (
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                )}
              </div>

              {/* tarefas (max 3 visíveis + overflow) */}
              <div className="flex-1 space-y-0.5">
                {dayTasks.slice(0, 3).map((t) => (
                  <MonthTaskChip key={t.id} tarefa={t} onClick={() => onSelectTarefa(t)} />
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[9px] text-zinc-600 pl-1.5 font-medium">
                    +{dayTasks.length - 3} mais
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
