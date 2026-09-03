import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useTaskStore } from '../../store/useTaskStore'
import { formatDrawerDate } from '../../lib/axelTaskMetadata'
import { showFocusRewardToast } from '../../lib/axelTaskCompletion'
import {
  DUE_BUCKET_LABELS,
  resolveDueBucket,
} from '../../lib/dueBucket'
import { loadTaskDrawerPrefs, saveTaskDrawerPrefs } from '../../lib/taskDrawerPrefs'
import { AXEL_BTN_PRIMARY } from '../../constants/axelSurfaces'
import type { TarefaUnificada } from '../../types'

// Faixa horizontal de metadados - datas, prazo e timer inline

interface AxelDrawerDetailsStripProps
{
  tarefa: TarefaUnificada
  deadline: string | null
  semPrazo?: boolean
  onSemPrazoChange?: (value: boolean) => void
  canPersist: boolean
  isCreatingNew?: boolean
  onDeadlineChange?: (iso: string | null) => void
  plannedStart: string | null
  onPlannedStartChange?: (iso: string | null) => void
}

const TAG =
  'inline-flex items-center gap-1 text-xs text-ink-muted px-2 py-1 rounded-sl border border-line bg-chrome/25 shrink-0 whitespace-nowrap'

function formatDateTag(iso: string | null): string
{
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
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
  semPrazo = false,
  onSemPrazoChange,
  canPersist,
  isCreatingNew = false,
  onDeadlineChange,
  plannedStart,
  onPlannedStartChange,
}: AxelDrawerDetailsStripProps)
{
  const execution = useTaskStore((s) => s.execution)
  const taskEstimates = useTaskStore((s) => s.taskEstimates)
  const startExecution = useTaskStore((s) => s.startExecution)
  const stopExecution = useTaskStore((s) => s.stopExecution)
  const moveTask = useTaskStore((s) => s.moveTask)
  const updateTarefa = useTaskStore((s) => s.updateTarefa)
  const patchTarefaLocal = useTaskStore((s) => s.patchTarefaLocal)

  const [, setTick] = useState(0)
  const [startedAt, setStartedAt] = useState<string | null>(null)

  const isActive = !isCreatingNew && execution?.taskId === tarefa.id
  const estimate = taskEstimates[tarefa.id] ?? 45
  const dueBucket = isCreatingNew
    ? (semPrazo ? 'sem_prazo' : null)
    : resolveDueBucket({ ...tarefa, data_vencimento: semPrazo ? null : deadline })

  const prazoObrigatorioPendente = Boolean(
    isCreatingNew && onSemPrazoChange && !semPrazo && !deadline,
  )

  useEffect(() =>
  {
    if (isCreatingNew || !tarefa.id) return
    const prefs = loadTaskDrawerPrefs(tarefa.id)
    setStartedAt(prefs.dataInicioReal)
  }, [isCreatingNew, tarefa.id])

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
    const now = new Date().toISOString()
    startExecution(tarefa.id, estimate)
    moveTask(tarefa.id, 'em_progresso')
    saveTaskDrawerPrefs(tarefa.id, { dataInicioReal: now })
    setStartedAt(now)
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
    <div className="space-y-2" aria-label="Detalhes da tarefa">
      <div className="flex flex-wrap items-center gap-2 min-w-0">
        {!isCreatingNew && tarefa.created_at && (
          <span className={TAG} title={formatDrawerDate(tarefa.created_at)}>
            <span className="text-[10px] uppercase tracking-wider text-ink-muted">Criada</span>
            <span className="font-mono tabular-nums text-ink">{formatDateTag(tarefa.created_at)}</span>
          </span>
        )}

        {startedAt && !isCreatingNew && (
          <span className={TAG} title={formatDrawerDate(startedAt)}>
            <span className="text-[10px] uppercase tracking-wider text-ink-muted">Iniciada</span>
            <span className="font-mono tabular-nums text-ink">{formatDateTag(startedAt)}</span>
          </span>
        )}

        {dueBucket && (
          <span className={TAG} title="Faixa de prazo no board">
            <span className="text-[10px] uppercase tracking-wider text-ink-muted">Faixa</span>
            <span className="font-mono text-ink text-[11px]">{DUE_BUCKET_LABELS[dueBucket]}</span>
          </span>
        )}

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
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono font-semibold tabular-nums text-accent border border-accent/30 rounded-sl animate-pulse hover:bg-accent-muted/30 transition-colors shrink-0"
            >
              <Pause size={14} strokeWidth={1.5} />
              {formatStopwatch(elapsedSeconds)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={!tarefa.id}
              className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-mono uppercase tracking-wide shrink-0 ${AXEL_BTN_PRIMARY} disabled:opacity-40`}
            >
              <Play size={14} strokeWidth={1.5} />
              Iniciar
            </button>
          )
        )}
      </div>

      {(onPlannedStartChange || onDeadlineChange) && (
        <div className="space-y-2 min-w-0 w-full">
          <div className="grid grid-cols-2 gap-2 min-w-0 w-full">
            {onPlannedStartChange ? (
              <label className={`${TAG} min-w-0 w-full`}>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted shrink-0">Início prev.</span>
                <input
                  type="datetime-local"
                  value={toInputValue(plannedStart)}
                  onChange={(e) =>
                  {
                    const v = e.target.value
                    if (!v)
                    {
                      onPlannedStartChange(null)
                      return
                    }
                    onPlannedStartChange(new Date(v).toISOString())
                  }}
                  className="text-xs font-mono text-ink bg-transparent border-none outline-none focus:ring-0 p-0 w-full min-w-0"
                  title={plannedStart ? formatDrawerDate(plannedStart) : 'Quando pretende começar'}
                />
              </label>
            ) : (
              <span />
            )}

            {onDeadlineChange ? (
              <label
                className={`${TAG} min-w-0 w-full cursor-pointer transition-colors ${
                  prazoObrigatorioPendente
                    ? 'border-2 border-atencao bg-atencao/10 ring-1 ring-atencao/35'
                    : deadline && !semPrazo
                      ? 'border-accent/35 bg-accent/5'
                      : ''
                } ${semPrazo ? 'opacity-50' : ''}`}
              >
                <span className={`text-[10px] uppercase tracking-wider shrink-0 ${
                  prazoObrigatorioPendente ? 'text-atencao font-semibold' : 'text-ink-muted'
                }`}>Prazo</span>
                <input
                  type="datetime-local"
                  disabled={semPrazo}
                  required={!semPrazo}
                  value={toInputValue(deadline)}
                  onChange={(e) =>
                  {
                    const v = e.target.value
                    if (!v)
                    {
                      onDeadlineChange(null)
                      return
                    }
                    onSemPrazoChange?.(false)
                    onDeadlineChange(new Date(v).toISOString())
                  }}
                  className="text-xs font-mono text-ink bg-transparent border-none outline-none focus:ring-0 p-0 w-full min-w-0 disabled:cursor-not-allowed"
                  title={semPrazo ? 'Intenção - ainda sem hora' : (deadline ? formatDrawerDate(deadline) : 'Definir prazo')}
                />
              </label>
            ) : (
              <span className={TAG} title={deadline ? formatDrawerDate(deadline) : undefined}>
                <span className="text-[10px] uppercase tracking-wider text-ink-muted">Prazo</span>
                <span className="font-mono tabular-nums text-ink">{formatDateTag(deadline)}</span>
              </span>
            )}
          </div>

          {onSemPrazoChange && (
            <label className="flex items-center gap-2 cursor-pointer min-h-[36px] text-ink-muted">
              <input
                type="checkbox"
                checked={semPrazo}
                onChange={(e) =>
                {
                  const checked = e.target.checked
                  onSemPrazoChange(checked)
                  if (checked)
                  {
                    onDeadlineChange?.(null)
                  }
                }}
                className="h-4 w-4 rounded border-line accent-accent shrink-0"
              />
              <span className="text-[11px]">Intenção sem hora - não é atraso. Agende quando couber.</span>
            </label>
          )}
        </div>
      )}
    </div>
  )
}
