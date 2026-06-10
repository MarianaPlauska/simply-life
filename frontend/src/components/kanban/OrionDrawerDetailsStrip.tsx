import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  formatDrawerDate,
  initialsFromName,
  resolveAssigneeName,
} from '../../lib/orionTaskMetadata'
import { showFocusRewardToast } from '../../lib/orionTaskCompletion'
import type { TarefaUnificada } from '../../types'

// Faixa horizontal de metadados — micro-tags + timer inline

interface OrionDrawerDetailsStripProps
{
  tarefa: TarefaUnificada
  deadline: string | null
  canPersist: boolean
  isCreatingNew?: boolean
  onDeadlineChange?: (iso: string | null) => void
}

function formatPrazoTag(iso: string | null): string
{
  if (!iso) return 'Sem prazo'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Sem prazo'
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function toInputValue(iso: string | null): string
{
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatStopwatch(totalSeconds: number): string
{
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function OrionDrawerDetailsStrip({
  tarefa,
  deadline,
  canPersist,
  isCreatingNew = false,
  onDeadlineChange,
}: OrionDrawerDetailsStripProps)
{
  const userProfile = useTaskStore((s) => s.userProfile)
  const execution = useTaskStore((s) => s.execution)
  const taskEstimates = useTaskStore((s) => s.taskEstimates)
  const setTaskEstimate = useTaskStore((s) => s.setTaskEstimate)
  const startExecution = useTaskStore((s) => s.startExecution)
  const stopExecution = useTaskStore((s) => s.stopExecution)
  const moveTask = useTaskStore((s) => s.moveTask)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)

  const [, setTick] = useState(0)
  const assignee = resolveAssigneeName(userProfile?.nome, tarefa)
  const assigneeShort = initialsFromName(assignee)
  const isActive = !isCreatingNew && execution?.taskId === tarefa.id
  const estimate = taskEstimates[tarefa.id] ?? 45

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
    if (isCreatingNew || !tarefa.id) return
    startExecution(tarefa.id, estimate)
    moveTask(tarefa.id, 'em_progresso')
    if (canPersist)
    {
      await updateTarefa(tarefa.id, { status: 'em_progresso' })
    }
    else
    {
      patchTarefaLocal(tarefa.id, { status: 'em_progresso' })
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 min-w-0"
      aria-label="Detalhes da tarefa"
    >
      <span className="inline-flex items-center gap-1 text-xs text-zinc-400 px-2 py-1 rounded-md border border-white/[0.04]">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Responsável</span>
        <span className="text-zinc-200 font-medium font-mono">{assigneeShort}</span>
      </span>

      {onDeadlineChange ? (
        <label className="inline-flex items-center gap-1.5 text-xs text-zinc-400 px-2 py-1 rounded-md border border-white/[0.04] cursor-pointer">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">Prazo</span>
          <input
            type="datetime-local"
            value={toInputValue(deadline)}
            onChange={(e) =>
            {
              const v = e.target.value
              if (!v)
              {
                onDeadlineChange(null)
                return
              }
              onDeadlineChange(new Date(v).toISOString())
            }}
            className="text-xs font-mono text-zinc-200 bg-transparent border-none outline-none focus:ring-0 p-0 max-w-[150px]"
            title={deadline ? formatDrawerDate(deadline) : 'Definir prazo'}
          />
        </label>
      ) : (
        <span
          className="inline-flex items-center gap-1 text-xs text-zinc-400 px-2 py-1 rounded-md border border-white/[0.04]"
          title={deadline ? formatDrawerDate(deadline) : undefined}
        >
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">Prazo</span>
          <span className="font-mono tabular-nums text-zinc-200">{formatPrazoTag(deadline)}</span>
        </span>
      )}

      <label className="inline-flex items-center gap-1 text-xs text-zinc-400 px-2 py-1 rounded-md border border-white/[0.04]">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500">Est.</span>
        <input
          type="number"
          min={5}
          max={480}
          value={estimate}
          disabled={isActive}
          onChange={(e) =>
          {
            const id = isCreatingNew ? 0 : tarefa.id
            setTaskEstimate(id, Number(e.target.value) || 45)
          }}
          className="w-10 text-xs font-mono tabular-nums text-zinc-200 bg-transparent border-none outline-none focus:ring-0 p-0"
        />
        <span className="font-mono text-zinc-400">m</span>
      </label>

      {!isCreatingNew && (
        isActive ? (
          <button
            type="button"
            onClick={() =>
            {
              const early = elapsedSeconds > 0 && elapsedSeconds < estimate * 60
              stopExecution()
              if (early) showFocusRewardToast(true)
            }}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono font-semibold tabular-nums text-indigo-300 border border-indigo-500/25 rounded-md animate-pulse hover:bg-indigo-600/10 transition-colors"
          >
            <Pause size={14} strokeWidth={1.5} />
            {formatStopwatch(elapsedSeconds)}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={!tarefa.id}
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-indigo-400 border border-indigo-500/20 rounded-md hover:bg-indigo-600/10 hover:text-indigo-300 transition-colors disabled:opacity-40"
          >
            <Play size={14} strokeWidth={1.5} />
            Iniciar Timer
          </button>
        )
      )}
    </div>
  )
}
