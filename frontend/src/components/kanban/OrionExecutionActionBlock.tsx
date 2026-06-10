import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'

// Motor de Execução — timer ativo + status em_progresso

interface OrionExecutionActionBlockProps
{
  taskId: number
  canPersist: boolean
  variant?: 'default' | 'sidebar'
}

const BTN_IDLE =
  'w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all rounded-md'

const BTN_TIMER =
  'w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-mono font-semibold tabular-nums text-indigo-300 border border-indigo-500/30 bg-indigo-600/10 animate-pulse rounded-md'

function formatStopwatch(totalSeconds: number): string
{
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function OrionExecutionActionBlock({
  taskId,
  canPersist,
  variant = 'default',
}: OrionExecutionActionBlockProps)
{
  const execution = useTaskStore((s) => s.execution)
  const taskEstimates = useTaskStore((s) => s.taskEstimates)
  const setTaskEstimate = useTaskStore((s) => s.setTaskEstimate)
  const startExecution = useTaskStore((s) => s.startExecution)
  const stopExecution = useTaskStore((s) => s.stopExecution)
  const moveTask = useTaskStore((s) => s.moveTask)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)

  const [, setTick] = useState(0)
  const estimate = taskEstimates[taskId] ?? 45
  const isActive = execution?.taskId === taskId
  const compact = variant === 'sidebar'

  useEffect(() =>
  {
    if (!isActive || !execution) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [isActive, execution])

  const elapsedSeconds = (() =>
  {
    if (!isActive || !execution) return 0
    return Math.floor((Date.now() - execution.startedAtMs) / 1000)
  })()

  const handleStart = async () =>
  {
    startExecution(taskId, estimate)
    moveTask(taskId, 'em_progresso')
    if (canPersist)
    {
      await updateTarefa(taskId, { status: 'em_progresso' })
    }
    else
    {
      patchTarefaLocal(taskId, { status: 'em_progresso' })
    }
  }

  if (compact)
  {
    return (
      <div className="space-y-2 min-w-0" aria-label="Timer de foco">
        <label className="flex items-center justify-between gap-2 text-xs text-zinc-400">
          <span>Estimativa (min)</span>
          <input
            type="number"
            min={5}
            max={480}
            value={estimate}
            disabled={isActive}
            onChange={(e) => setTaskEstimate(taskId, Number(e.target.value) || 45)}
            className="w-14 h-7 text-xs font-mono tabular-nums bg-zinc-900/50 border border-white/[0.04] rounded px-1.5 text-zinc-200 outline-none focus:border-indigo-500/50 focus:ring-0 disabled:opacity-50"
          />
        </label>
        {isActive ? (
          <button type="button" onClick={stopExecution} className={BTN_TIMER}>
            {formatStopwatch(elapsedSeconds)}
            <Pause size={14} strokeWidth={1.5} />
          </button>
        ) : (
          <button type="button" onClick={() => void handleStart()} className={BTN_IDLE}>
            <Play size={14} strokeWidth={1.5} />
            Iniciar Foco
          </button>
        )}
        <p className="text-[10px] text-zinc-400 leading-snug">
          +20% XP se concluir antes do estimado
        </p>
      </div>
    )
  }

  return (
    <section className="py-3 mb-3 border-b border-white/[0.04] min-w-0" aria-label="Motor de execução">
      <h3 className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
        Execução
      </h3>
      <label className="flex items-center gap-2 text-xs text-zinc-400 mb-2 min-w-0">
        <span className="shrink-0">Estimativa (min):</span>
        <input
          type="number"
          min={5}
          max={480}
          value={estimate}
          disabled={isActive}
          onChange={(e) => setTaskEstimate(taskId, Number(e.target.value) || 45)}
          className="w-16 h-8 text-sm font-mono tabular-nums bg-zinc-900/50 border border-white/[0.04] rounded-md px-2 text-zinc-200 outline-none focus:border-indigo-500/50 focus:ring-0 disabled:opacity-50"
        />
      </label>
      {isActive ? (
        <button type="button" onClick={stopExecution} className={BTN_TIMER}>
          {formatStopwatch(elapsedSeconds)}
          <Pause size={16} strokeWidth={1.5} />
        </button>
      ) : (
        <button type="button" onClick={() => void handleStart()} className={BTN_IDLE}>
          <Play size={16} strokeWidth={1.5} />
          Iniciar Foco
        </button>
      )}
      <p className="mt-2 text-[11px] text-zinc-400 leading-snug">
        Termine antes do tempo estimado e receba{' '}
        <span className="font-mono text-indigo-400/90">+20% de Bônus de XP</span>.
      </p>
    </section>
  )
}
