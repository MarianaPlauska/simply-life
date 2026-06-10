import { useEffect } from 'react'
import { Zap, Search, Loader2, Sparkles, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { orionCompleteTask } from '../../lib/orionTaskCompletion'
import { useTaskStore } from '../../store/useTaskStore'
import { useSuperhumanTasks } from '../../hooks/useSuperhumanTasks'
import { SuperhumanTaskRow } from './SuperhumanTaskRow'

// Modo Superhuman — lista hiperdensa por score (§2.4 "tudo é linha")

export function SuperhumanView()
{
  const {
    activeTasks,
    isLoading,
    fetchTarefas,
    searchQuery,
    setSearchQuery,
  } = useSuperhumanTasks()

  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const deleteTarefa = useTaskStore((s) => s.deleteTarefa)
  const realtimeStatus = useTaskStore((s) => s.realtimeStatus)

  useEffect(() =>
  {
    fetchTarefas()
  }, [fetchTarefas])

  const liveLabel =
    realtimeStatus === 'live' ? 'Ao vivo'
      : realtimeStatus === 'connecting' ? 'Conectando…'
        : realtimeStatus === 'error' ? 'Realtime off'
          : 'Offline'

  const liveDot =
    realtimeStatus === 'live' ? 'bg-emerald-500'
      : realtimeStatus === 'connecting' ? 'bg-amber-400 animate-pulse'
        : 'bg-zinc-700'

  return (
    <div className="max-w-5xl mx-auto w-full pb-16 px-1">
      <header className="mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-violet-400" />
            Modo Superhuman
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 normal-case">
              <Radio className="w-3.5 h-3.5" />
              <span className={`w-2 h-2 rounded-full ${liveDot}`} />
              {liveLabel}
            </span>
          </h1>
          <p className="text-[13px] text-zinc-400 mt-1">
            Lista densa por score — mesma linguagem do Kanban temporal.
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar…"
            className="w-56 bg-transparent border border-zinc-900 rounded pl-8 pr-3 py-1.5 text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-violet-500/40"
          />
        </div>
      </header>

      {/* lista de tarefas — divisor entre linhas com cor sutil de fundo */}
      <div role="list" className="flex flex-col gap-0.5 border-t border-zinc-900">
        {isLoading && activeTasks.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="text-[12px] text-zinc-500">Priorizando…</span>
          </div>
        )}

        {!isLoading && activeTasks.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <Sparkles className="w-5 h-5 text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-300">Inbox zero</p>
            <p className="text-[12px] text-zinc-500 mt-1">Nenhuma tarefa ativa no radar.</p>
          </div>
        )}

        {activeTasks.map((t) => (
          <SuperhumanTaskRow
            key={t.id}
            tarefa={t}
            onComplete={async (task) =>
            {
              await orionCompleteTask(task)
            }}
            onUpdate={updateTarefa}
            onArchive={async (id) =>
            {
              await deleteTarefa(id)
              toast.success('Arquivada')
            }}
          />
        ))}
      </div>
    </div>
  )
}
