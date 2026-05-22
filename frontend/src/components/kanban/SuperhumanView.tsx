import { useEffect } from 'react'
import { Zap, Search, Loader2, Sparkles, Radio } from 'lucide-react'
import { toast } from 'sonner'
import { useTaskStore } from '../../store/useTaskStore'
import { useSuperhumanTasks } from '../../hooks/useSuperhumanTasks'
import { SuperhumanTaskRow } from './SuperhumanTaskRow'

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
        : 'bg-zinc-600'

  return (
    <div className="max-w-5xl mx-auto w-full pb-16 px-1">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" />
            Modo Superhuman
          </h1>
          <p className="text-[12px] text-zinc-500 mt-1">
            Lista densa por score — mesma linguagem visual do Kanban temporal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500 uppercase tracking-wider">
            <Radio className="w-3 h-3" />
            <span className={`w-1.5 h-1.5 rounded-full ${liveDot}`} />
            {liveLabel}
          </span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar…"
              className="w-56 bg-transparent border border-zinc-900 rounded-md pl-8 pr-3 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-700 outline-none focus:border-violet-500/40"
            />
          </div>
        </div>
      </header>

      <div role="list" className="flex flex-col border-t border-zinc-900/80">
        {isLoading && activeTasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-2">
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            <span className="text-[11px] text-zinc-500">Priorizando…</span>
          </div>
        ) : activeTasks.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Sparkles className="w-5 h-5 text-zinc-600 mb-2" />
            <p className="text-sm text-zinc-400">Inbox zero</p>
            <p className="text-[11px] text-zinc-600 mt-1">Nenhuma tarefa ativa no radar.</p>
          </div>
        ) : (
          activeTasks.map((t) => (
            <SuperhumanTaskRow
              key={t.id}
              tarefa={t}
              onComplete={async (task) =>
              {
                await updateTarefa(task.id, { status: 'concluida' })
                toast.success('Concluída')
              }}
              onUpdate={updateTarefa}
              onArchive={async (id) =>
              {
                await deleteTarefa(id)
                toast.success('Arquivada')
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
