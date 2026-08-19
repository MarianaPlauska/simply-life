import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { TarefaUnificada } from '../../types'

// TimelineBlock — Camada 2 (contexto tatico)
// Linha de execucao do dia HH:MM ─ titulo  score (estilo Linear/Things)

interface Slot
{
  time: string
  task: TarefaUnificada
}

function formatTime(d: Date): string
{
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isToday(date: Date): boolean
{
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
}

export function TimelineBlock()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const navigate = useNavigate()

  // tarefas com data_vencimento HOJE, ordenadas por horario
  const slots = useMemo<Slot[]>(() =>
  {
    return tarefas
      .filter((t) => t.status !== 'concluida' && t.data_vencimento)
      .map((t) =>
      {
        const d = new Date(t.data_vencimento as string)
        return { task: t, date: d }
      })
      .filter(({ date }) => isToday(date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 6)
      .map(({ task, date }) => ({ time: formatTime(date), task }))
  }, [tarefas])

  if (slots.length === 0) return null

  return (
    <section className="space-y-1">
      <header className="flex items-center justify-between px-1">
        <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          Linha de Execução · Hoje
        </span>
        <button
          onClick={() => navigate('/kanban')}
          className="flex items-center gap-1 text-[12px] text-zinc-500 hover:text-white transition-colors"
        >
          Ver agenda <ArrowRight className="w-3 h-3" />
        </button>
      </header>

      <ul role="list" className="divide-y divide-zinc-900 border-y border-zinc-900">
        {slots.map(({ time, task }) =>
        {
          const overdue = new Date(task.data_vencimento as string).getTime() < Date.now()
          return (
            <li
              key={task.id}
              className="flex items-center gap-3 px-1 py-1.5 hover:bg-zinc-900/40 cursor-pointer transition-colors"
              onClick={() => navigate('/kanban')}
            >
              <span className={`text-[13px] font-mono tabular-nums w-12 ${overdue ? 'text-red-400' : 'text-zinc-400'}`}>
                {time}
              </span>
              <span className="text-zinc-700">─</span>
              <span className="flex-1 min-w-0 text-[13px] text-zinc-200 truncate">{task.titulo}</span>
              <span className={`text-[12px] font-mono tabular-nums shrink-0 ${
                (task.score_urgencia ?? 0) >= 80 ? 'text-red-400'
                  : (task.score_urgencia ?? 0) >= 50 ? 'text-amber-400' : 'text-zinc-500'
              }`}>
                score {task.score_urgencia ?? 0}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
