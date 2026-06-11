import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import {
  formatDrawerDate,
  initialsFromName,
  resolveAssigneeName,
} from '../../lib/axelTaskMetadata'
import { showFocusRewardToast } from '../../lib/axelTaskCompletion'
import {
  DUE_BUCKET_LABELS,
  resolveDueBucket,
} from '../../lib/dueBucket'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

// Faixa horizontal de metadados — micro-tags + timer inline

interface AxelDrawerDetailsStripProps
{
  tarefa: TarefaUnificada
  deadline: string | null
  canPersist: boolean
  isCreatingNew?: boolean
  onDeadlineChange?: (iso: string | null) => void
}

const TAG =
  'inline-flex items-center gap-1 text-xs text-ink-muted px-2 py-1 rounded-sl border border-line bg-chrome/25'

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

export function AxelDrawerDetailsStrip({
  tarefa,
  deadline,
  canPersist,
  isCreatingNew = false,
  onDeadlineChange,
}: AxelDrawerDetailsStripProps)
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
  const dueBucket = isCreatingNew
    ? null
    : resolveDueBucket({ ...tarefa, data_vencimento: deadline })

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
      <span className={TAG}>
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Responsável</span>
        <span className="text-ink font-medium font-mono">{assigneeShort}</span>
      </span>

      {dueBucket && (
        <span className={TAG} title="Faixa de prazo no board">
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">Faixa</span>
          <span className="font-mono text-ink text-[11px]">{DUE_BUCKET_LABELS[dueBucket]}</span>
        </span>
      )}

      {onDeadlineChange ? (
        <label className={`${TAG} cursor-pointer`}>
          <span className="text-[10px] uppercase tracking-wider text-ink-muted shrink-0">Prazo</span>
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
            className="text-xs font-mono text-ink bg-transparent border-none outline-none focus:ring-0 p-0 max-w-[150px]"
            title={deadline ? formatDrawerDate(deadline) : 'Definir prazo'}
          />
        </label>
      ) : (
        <span
          className={TAG}
          title={deadline ? formatDrawerDate(deadline) : undefined}
        >
          <span className="text-[10px] uppercase tracking-wider text-ink-muted">Prazo</span>
          <span className="font-mono tabular-nums text-ink">{formatPrazoTag(deadline)}</span>
        </span>
      )}

      <label className={TAG}>
        <span className="text-[10px] uppercase tracking-wider text-ink-muted">Est.</span>
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
          className="w-10 text-xs font-mono tabular-nums text-ink bg-transparent border-none outline-none focus:ring-0 p-0"
        />
        <span className="font-mono text-ink-muted">m</span>
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
            className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono font-semibold tabular-nums text-accent border border-accent/30 rounded-sl animate-pulse hover:bg-accent-muted/30 transition-colors"
          >
            <Pause size={14} strokeWidth={1.5} />
            {formatStopwatch(elapsedSeconds)}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={!tarefa.id}
            className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono uppercase tracking-wide ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
          >
            <Play size={14} strokeWidth={1.5} />
            Iniciar
          </button>
        )
      )}
    </div>
  )
}
