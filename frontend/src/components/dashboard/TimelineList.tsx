import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import type { TarefaUnificada } from '../../types'

// LINHA DO TEMPO · HOJE — lista densa: HH:MM • Titulo | Tag
// Cada linha tem bullet colorido por categoria, sem cards

function formatTime(d: Date): string
{
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isToday(d: Date): boolean
{
  const now = new Date()
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

function tagFor(origem: string | null | undefined): { label: string; bullet: string }
{
  if (origem === 'saude') return { label: 'Saúde', bullet: 'bg-rose-500' }
  if (origem === 'financeiro') return { label: 'Financeiro', bullet: 'bg-emerald-500' }
  if (origem === 'gmail_triage' || origem === 'gmail_api' || origem === 'gmail_mock') return { label: 'Comunicação', bullet: 'bg-violet-500' }
  if (origem === 'teams') return { label: 'Reunião', bullet: 'bg-amber-500' }
  return { label: 'Trabalho', bullet: 'bg-amber-500' }
}

interface TimelineItem
{
  time: string
  task: TarefaUnificada
}

export function TimelineList()
{
  const tarefas = useTaskStore((s) => s.tarefas)
  const navigate = useNavigate()

  const items = useMemo<TimelineItem[]>(() =>
  {
    return tarefas
      .filter((t) => t.status !== 'concluida' && t.data_vencimento)
      .map((t) => ({ task: t, date: new Date(t.data_vencimento as string) }))
      .filter(({ date }) => isToday(date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)
      .map(({ task, date }) => ({ time: formatTime(date), task }))
  }, [tarefas])

  if (items.length === 0) return null

  return (
    <section className="bg-card border border-zinc-800 rounded-xl overflow-hidden">
      <header className="px-4 pt-3 pb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
          Linha do Tempo <span className="text-zinc-700">·</span> Hoje
        </h3>
      </header>

      <ul role="list" className="divide-y divide-zinc-900/80">
        {items.map(({ time, task }) =>
        {
          const tag = tagFor(task.origem)
          const overdue = new Date(task.data_vencimento as string).getTime() < Date.now()
          return (
            <li
              key={task.id}
              className="flex items-center gap-4 px-4 py-2.5 hover:bg-zinc-900/40 cursor-pointer transition-colors"
              onClick={() => navigate('/kanban')}
            >
              <span className={`text-[13px] font-mono tabular-nums w-12 ${overdue ? 'text-rose-400' : 'text-zinc-400'}`}>
                {time}
              </span>
              <span className={`w-2 h-2 rounded-full ${tag.bullet} shadow-[0_0_6px_currentColor]`} />
              <span className="flex-1 min-w-0 text-[13.5px] font-medium text-zinc-100 truncate">
                {task.titulo}
              </span>
              <span className="text-[12px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 px-2 py-0.5 rounded-full">
                {tag.label}
              </span>
            </li>
          )
        })}
      </ul>

      <div className="px-4 py-2.5 border-t border-zinc-900 flex justify-end">
        <button
          onClick={() => navigate('/calendario')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-zinc-300 bg-card border border-zinc-800 hover:border-violet-500/40 hover:text-white transition-colors"
        >
          Ver agenda <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}
